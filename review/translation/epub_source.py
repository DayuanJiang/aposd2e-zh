"""Extract the user-supplied EPUB for local proofreading, never into docs/en."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import tinycss2

from audit import BASE, OUT, corpus, hits, tsv

EXPECTED_SHA256 = "9f587b71073a53a7813f4048669ee80ec3183eedd8eeb43736add7601d6b3d21"


def local_name(node):
    return node.tag.rsplit("}", 1)[-1]


def code_classes(css):
    result = set()
    for rule in tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True):
        if rule.type != "qualified-rule":
            continue
        declarations = tinycss2.parse_declaration_list(
            rule.content, skip_comments=True, skip_whitespace=True
        )
        if any(d.type == "declaration" and d.lower_name == "font-family"
               and "typewriter" in tinycss2.serialize(d.value).lower()
               for d in declarations):
            for token in rule.prelude:
                if token.type == "ident":
                    result.add(token.value)
    return result


def prose(node, mono):
    text = node.text or ""
    for child in node:
        if not (set(child.get("class", "").split()) & mono):
            text += prose(child, mono)
        else:
            text += " "
        text += child.tail or ""
    return text.replace("\u00a0", " ")


def extract(path, destination):
    checksum = hashlib.sha256(path.read_bytes()).hexdigest()
    if checksum != EXPECTED_SHA256:
        raise ValueError("Different EPUB: review its structure before reusing this extractor.")
    destination.mkdir(parents=True, exist_ok=True)
    rows, manifest = [], {}
    with ZipFile(path) as archive:
        container = ET.fromstring(archive.read("META-INF/container.xml"))
        opf = next(n.get("full-path") for n in container.iter() if local_name(n) == "rootfile")
        package = ET.fromstring(archive.read(opf))
        items = {n.get("id"): n.get("href") for n in package.iter() if local_name(n) == "item"}
        spine = [str(PurePosixPath(opf).parent / items[n.get("idref")])
                 for n in package.iter() if local_name(n) == "itemref"]
        mono = set()
        for name in archive.namelist():
            if name.endswith(".css"):
                mono |= code_classes(archive.read(name).decode("utf-8"))
        for name in spine:
            match = re.search(r"part(\d+)\.xhtml$", name)
            if not match:
                continue
            part = int(match[1])
            if part == 4:
                target, section = "preface.md", "intro"
            elif 5 <= part <= 26:
                target, section = f"ch{part - 4:02}.md", "intro"
            elif 28 <= part <= 30:
                target, section = "summary.md", f"section_{part - 27}"
            else:
                continue
            raw = archive.read(name)
            manifest[name] = hashlib.sha256(raw).hexdigest()
            root = ET.fromstring(raw)
            paragraphs = [n for n in root.iter() if local_name(n) == "p"]
            for ordinal, node in enumerate(paragraphs, 1):
                text = "".join(node.itertext()).replace("\u00a0", " ").strip()
                cls = set(node.get("class", "").split())
                kind = "code" if cls & mono else "prose"
                section_match = re.match(r"(\d+\.\d+)\s", text)
                if section_match and "class_s7t" in cls:
                    section, kind = section_match[1], "heading"
                elif ordinal <= (2 if 5 <= part <= 26 else 1):
                    kind = "heading"
                elif "class_sdc" in cls:
                    kind = "label"
                elif not text:
                    kind = "image"
                row = {
                    "path": f"epub/{target}", "section": section,
                    "id": f"{name}#p{ordinal}:{hashlib.sha256(ET.tostring(node)).hexdigest()[:10]}",
                    "kind": kind, "text": prose(node, mono).strip(), "full_text": text,
                    "images": [n.get("src") for n in node.iter() if local_name(n) == "img"],
                }
                rows.append(row)
    for name in sorted({r["path"].split("/")[-1] for r in rows}):
        content, line = [], 1
        for row in rows:
            if row["path"] != f"epub/{name}":
                continue
            row["line"] = line
            content.extend([f'[{row["kind"]} {row["id"]}]', row["full_text"], ""])
            line += 3
        (destination / name).write_text("\n".join(content) + "\n")
    (destination / "blocks.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    metadata = {
        "epub_filename": path.name, "sha256": checksum, "translation_baseline": BASE,
        "title": "A Philosophy of Software Design, 2nd Edition",
        "spine_files": manifest, "kinds": dict(Counter(r["kind"] for r in rows)),
        "note": "Full English is local only; docs/en remains the original public excerpt."
    }
    (OUT / "epub-source.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata["kinds"]))
    return rows


def statistics(rows):
    import csv
    data = {"en": [r for r in rows if r["kind"] == "prose" and r["text"]],
            "zh": corpus()["zh"]}
    terms = list(csv.DictReader((OUT / "terms.tsv").open(encoding="utf-8"), delimiter="\t"))
    table = []
    for term in terms:
        values = [term["english"], term["preferred_zh"]]
        for lang, column in (("en", "en_forms"), ("zh", "zh_variants")):
            found, variants = hits(data[lang], term[column].split("|"), lang == "en")
            values += [sum(n for _, n in found), len({b["path"] for b, _ in found}),
                       json.dumps(variants, ensure_ascii=False)]
        table.append(values)
    tsv("epub-term-counts.tsv", ["english", "preferred_zh", "en_count", "en_files",
                                "en_forms", "zh_count", "zh_files", "zh_variants"], table)
    print(f"Full EPUB term statistics: {len(data['en'])} prose blocks, {len(terms)} terms.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("epub", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--candidates", action="store_true")
    args = parser.parse_args()
    rows = extract(args.epub, args.destination)
    statistics(rows)
    if args.candidates:
        import audit
        audit.OUT = args.destination / "audit"
        audit.OUT.mkdir(exist_ok=True)
        shutil.copyfile(OUT / "terms.tsv", audit.OUT / "terms.tsv")
        audit.extract({"en": [r for r in rows if r["kind"] == "prose" and r["text"]],
                       "zh": corpus()["zh"]})
        for name in ("english-candidates.tsv", "coverage.tsv"):
            shutil.copyfile(audit.OUT / name, OUT / f"epub-{name}")
