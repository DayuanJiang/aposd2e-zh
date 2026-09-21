"""Read-only corpus analysis and translation protection checks.

Run from the repository root. Generated reports never modify book files.
NLTK requires averaged_perceptron_tagger_eng and wordnet in NLTK_DATA.
"""

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import runpy
import json
from pathlib import Path
import re
import subprocess
import tempfile

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
BASE = "4362314d5bb8eedbe2a088f950850a187b3f8641"
MD = MarkdownIt("commonmark").enable("table")
WORD = re.compile(r"[A-Za-z][A-Za-z0-9]*(?:[-'][A-Za-z0-9]+)*(?:\+\+|#)?|[.!?;,()]")


def original(path):
    return subprocess.check_output(
        ["git", "show", f"{BASE}:{path}"], cwd=ROOT
    ).decode("utf-8")


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def blocks(path, text):
    result, section, heading, ordinal = [], "intro", "", 0
    unnumbered = 0
    for token in MD.parse(text):
        if token.type == "heading_open":
            heading = token.tag
        elif token.type == "heading_close":
            heading = ""
        elif token.type == "inline":
            if heading:
                match = re.match(r"(\d+\.\d+)\b", token.content)
                if match:
                    section = match[1]
                elif heading == "h1":
                    section = "intro"
                else:
                    unnumbered += 1
                    section = f"section_{unnumbered}"
                continue
            # Keep text inside emphasis and link labels, not code, URLs or images.
            parts = []
            for child in token.children or []:
                if child.type == "text":
                    parts.append(re.sub(r"https?://\S+|[\w.+-]+@[\w.-]+", "", child.content))
                elif child.type in ("softbreak", "hardbreak"):
                    parts.append(" ")
                elif child.type in ("code_inline", "image", "html_inline"):
                    parts.append(" ")
            prose = "".join(parts).strip()
            if not prose:
                continue
            # README is project navigation after its first introductory section.
            if path.endswith("README.md") and section != "intro":
                continue
            ordinal += 1
            result.append({
                "path": path, "section": section, "line": token.map[0] + 1,
                "id": f"{path}#p{ordinal}:{digest(token.content)[:10]}",
                "text": prose,
            })
    return result


def corpus():
    names = ["README.md", "preface.md"]
    names += [f"ch{i:02}.md" for i in range(1, 23)] + ["summary.md"]
    return {
        lang: [b for name in names for b in blocks(
            f"docs/{prefix}{name}", original(f"docs/{prefix}{name}")
        )]
        for lang, prefix in (("en", "en/"), ("zh", ""))
    }


def tsv(name, columns, rows):
    with (OUT / name).open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, delimiter="\t", lineterminator="\n")
        writer.writerow(columns)
        writer.writerows(rows)


def locations(items):
    return "; ".join(f'{b["path"]}:{b["line"]}' for b in items)


def aligned(data):
    decision = json.loads((OUT / "alignment-decisions.json").read_text())
    assert decision["baseline"] == BASE
    grouped = {lang: defaultdict(list) for lang in data}
    for lang, items in data.items():
        for block in items:
            grouped[lang][(Path(block["path"]).name, block["section"])].append(block)
    pairs = []
    for (name, section), en in grouped["en"].items():
        if name not in decision["reviewed_files"]:
            raise ValueError(f"Alignment not reviewed: {name}")
        zh = grouped["zh"].get((name, section), [])
        key = f"{name}#{section}"
        mapping = decision["overrides"].get(key)
        if mapping is None:
            if len(en) != len(zh):
                raise ValueError(f"Explicit alignment required: {key}")
            mapping = [[[i], [i]] for i in range(1, len(en) + 1)]
        seen = {"en": [], "zh": []}
        for e, z in mapping:
            pairs.append(([en[i - 1] for i in e], [zh[i - 1] for i in z]))
            seen["en"] += e
            seen["zh"] += z
        assert sorted(seen["en"]) == list(range(1, len(en) + 1)), key
        assert sorted(seen["zh"]) == list(range(1, len(zh) + 1)), key
    return pairs


def write_alignment(data):
    pairs = aligned(data)
    tsv("alignments.tsv", ["en_ids", "zh_ids", "en_locations", "zh_locations", "status"],
        [("; ".join(b["id"] for b in en), "; ".join(b["id"] for b in zh),
          locations(en), locations(zh), "paired" if en and zh else "unpaired")
         for en, zh in pairs])
    print(f"{sum(bool(en and zh) for en, zh in pairs)} paired groups; "
          f"{sum(not en or not zh for en, zh in pairs)} explicitly unpaired groups.")


def extract(data):
    import jieba
    import nltk
    from nltk.stem import WordNetLemmatizer

    lem = WordNetLemmatizer()
    counts, files, forms, refs = Counter(), defaultdict(set), defaultdict(Counter), {}
    for block in data["en"]:
        tagged = nltk.pos_tag(WORD.findall(block["text"].replace("\u2019", "'")))
        for start, (_, tag) in enumerate(tagged):
            if not tag.startswith(("NN", "JJ")):
                continue
            for end in range(start + 1, min(start + 5, len(tagged)) + 1):
                span = tagged[start:end]
                if not all(t.startswith(("NN", "JJ")) for _, t in span):
                    break
                if not span[-1][1].startswith("NN"):
                    continue
                key = " ".join(
                    word if word.isupper() else
                    lem.lemmatize(word.lower(), "n" if tag.startswith("NN") else "a")
                    for word, tag in span
                )
                counts[key] += 1
                files[key].add(block["path"])
                forms[key][" ".join(w for w, _ in span)] += 1
                refs.setdefault(key, f'{block["path"]}:{block["line"]}')
    tsv("english-candidates.tsv", ["candidate", "count", "files", "forms", "first_source"],
        [(key, count, len(files[key]), json.dumps(forms[key], ensure_ascii=False), refs[key])
         for key, count in counts.most_common() if count >= 2])

    jieba.dt.tmp_dir = tempfile.gettempdir()
    terms_file = OUT / "terms.tsv"
    if terms_file.exists():
        for row in csv.DictReader(terms_file.open(encoding="utf-8"), delimiter="\t"):
            for word in row["zh_variants"].split("|"):
                jieba.add_word(word, freq=100000)
    zh_count, zh_files = Counter(), defaultdict(set)
    for block in data["zh"]:
        for word in jieba.cut(block["text"], HMM=False):
            if len(word) >= 2 and re.fullmatch(r"[\u3400-\u9fff]+", word):
                zh_count[word] += 1
                zh_files[word].add(block["path"])
    tsv("chinese-candidates.tsv", ["candidate", "count", "files"],
        [(key, count, len(zh_files[key])) for key, count in zh_count.most_common()
         if count >= 3])
    if (OUT / "alignment-decisions.json").exists():
        paired_zh = [b for en, zh in aligned(data) if en and zh for b in zh]
        paired_count, paired_files = Counter(), defaultdict(set)
        for b in paired_zh:
            for word in jieba.cut(b["text"], HMM=False):
                if len(word) >= 2 and re.fullmatch(r"[\u3400-\u9fff]+", word):
                    paired_count[word] += 1
                    paired_files[word].add(b["path"])
        tsv("paired-chinese-candidates.tsv", ["candidate", "count", "files"],
            [(key, count, len(paired_files[key]))
             for key, count in paired_count.most_common() if count >= 2])
    grouped = {lang: defaultdict(list) for lang in data}
    for lang, items in data.items():
        for b in items:
            grouped[lang][(Path(b["path"]).name, b["section"])].append(b)
    rows = []
    for key, zh in grouped["zh"].items():
        en = grouped["en"].get(key, [])
        status = "no_english" if not en else "alignment_required"
        if en and len(en) == len(zh):
            status = "same_count_not_yet_verified"
        rows.append((*key, len(en), len(zh), status, locations(en), locations(zh)))
    tsv("coverage.tsv", ["file", "section", "en_blocks", "zh_blocks", "status",
                         "en_locations", "zh_locations"], rows)
    print(json.dumps({
        "baseline": BASE, "english_blocks": len(data["en"]),
        "chinese_blocks": len(data["zh"]), "english_candidates": len(counts),
        "chinese_candidates": len(zh_count),
    }, indent=2))


def hits(items, aliases, english):
    pattern = "|".join(re.escape(a) for a in sorted(set(aliases), key=len, reverse=True))
    if english:
        pattern = r"(?<![A-Za-z])(?:" + pattern + r")(?![A-Za-z])"
    rx = re.compile(pattern, re.I if english else 0)
    result, variants = [], Counter()
    for block in items:
        matches = list(rx.finditer(block["text"]))
        for match in matches:
            variants[match.group()] += 1
        if matches:
            result.append((block, len(matches)))
    return result, variants


def term_stats(data):
    terms = list(csv.DictReader((OUT / "terms.tsv").open(encoding="utf-8"), delimiter="\t"))
    rows = []
    for term in terms:
        values = [term["english"], term["preferred_zh"]]
        for lang, column in (("en", "en_forms"), ("zh", "zh_variants")):
            found, variants = hits(data[lang], term[column].split("|"), lang == "en")
            values += [sum(n for _, n in found), len({b["path"] for b, _ in found}),
                       json.dumps(variants, ensure_ascii=False),
                       locations([b for b, _ in found])]
        rows.append(values)
    tsv("term-counts.tsv", ["english", "preferred_zh", "en_count", "en_files", "en_forms",
                          "en_locations", "zh_count", "zh_files", "zh_variants",
                          "zh_locations"], rows)
    print(f"Counted {len(rows)} curated terms against immutable baseline {BASE}.")
    if (OUT / "alignment-decisions.json").exists():
        pairs = [(e, z) for e, z in aligned(data) if e and z]
        paired = {"en": [b for en, _ in pairs for b in en],
                  "zh": [b for _, zh in pairs for b in zh]}
        rows = []
        for term in terms:
            values = [term["english"]]
            for lang, column in (("en", "en_forms"), ("zh", "zh_variants")):
                found, variants = hits(paired[lang], term[column].split("|"), lang == "en")
                values += [sum(n for _, n in found), len({b["path"] for b, _ in found}),
                           json.dumps(variants, ensure_ascii=False)]
            rows.append(values)
        tsv("paired-term-counts.tsv",
            ["english", "en_count", "en_files", "en_forms", "zh_count", "zh_files",
             "zh_variants"], rows)


def protected(text):
    values = defaultdict(list)
    for token in MD.parse(text):
        if token.type in ("fence", "code_block", "html_block"):
            values[token.type].append((token.info, token.content))
        elif token.type == "heading_open":
            values["heading_levels"].append(token.tag)
        elif token.type.endswith("_open"):
            values["structure"].append(token.type)
        if token.type == "inline":
            children = token.children or []
            for child in children:
                if child.type in ("code_inline", "html_inline"):
                    values[child.type].append(child.content)
                if child.type in ("link_open", "image"):
                    values[child.type].append(child.attrs)
                if child.type == "text":
                    # English quotations and numeric tokens inside prose are protected.
                    values["numbers"].extend(re.findall(r"\d+(?:[.,]\d+)*%?", child.content))
                    values["latin_words"].extend(
                        re.findall(r"[A-Za-z][A-Za-z0-9_]*(?:[-'.:+/][A-Za-z0-9_]+)*",
                                   child.content)
                    )
            if not re.search(r"[\u3400-\u9fff]", token.content):
                values["english_nodes"].append(token.content)
    values["footnotes"] = re.findall(r"\[\^[^\]]+\]", text)
    return dict(values)


def traditional(text):
    import opencc
    module = runpy.run_path(str(ROOT / "bin/zh-tw.py"))
    return module["convert_text"](text, opencc.OpenCC("s2twp.json"), module["load_rules"]())


def check():
    errors, reviewed = [], []
    names = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", BASE], cwd=ROOT, text=True
    ).splitlines()
    for name in names:
        if name.startswith("docs/en/") or name.startswith("docs/figures/"):
            before = subprocess.check_output(["git", "show", f"{BASE}:{name}"], cwd=ROOT)
            if (ROOT / name).read_bytes() != before:
                errors.append(f"{name}: protected file changed")
        elif name == "README.md" or (name.startswith("docs/") and name.endswith(".md")):
            before, after = original(name), (ROOT / name).read_text()
            corrections_file = OUT / "source-corrections.json"
            corrections = json.loads(corrections_file.read_text()) if corrections_file.exists() else []
            for entry in corrections:
                old, new = entry["before"], entry["after"]
                if name == entry["file"]:
                    pass
                elif entry["file"].startswith("docs/") and name == entry["file"].replace("docs/", "docs/zh-tw/", 1):
                    old, new = traditional(old), traditional(new)
                else:
                    continue
                if before.count(old) != 1:
                    errors.append(f"{name}: source correction no longer matches baseline")
                else:
                    before = before.replace(old, new, 1)
            checked = after
            notes_file = OUT / "errata.json"
            notes = json.loads(notes_file.read_text()) if notes_file.exists() else []
            for entry in notes:
                target = entry["file"]
                note = entry["note"]
                if name == target.replace("docs/", "docs/zh-tw/", 1):
                    note = traditional(note)
                elif name != target:
                    continue
                if checked.count(note) != 1:
                    errors.append(f"{name}: missing or altered registered note {entry['id']}")
                else:
                    checked = checked.replace(note, "", 1)
            a, b = protected(before), protected(checked)
            differences = [k for k in a.keys() | b.keys() if a.get(k) != b.get(k)]
            if differences:
                errors.append(f"{name}: {', '.join(differences)}")
            if original(name) != after:
                reviewed.append(name)
    print(json.dumps({"changed_markdown": reviewed, "failures": errors}, indent=2))
    return bool(errors)


def baseline():
    names = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", BASE], cwd=ROOT, text=True
    ).splitlines()
    manifest = {"commit": BASE, "files": {}}
    for name in names:
        content = subprocess.check_output(["git", "show", f"{BASE}:{name}"], cwd=ROOT)
        manifest["files"][name] = hashlib.sha256(content).hexdigest()
    value = json.dumps(manifest, indent=2) + "\n"
    path = OUT / "baseline.json"
    if path.exists() and path.read_text() != value:
        raise ValueError("Refusing to replace a different baseline.")
    path.write_text(value)
    print(f"Recorded immutable baseline hashes for {len(manifest['files'])} files.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["extract", "terms", "align", "baseline", "check"])
    args = parser.parse_args()
    if args.command == "check":
        return check()
    if args.command == "baseline":
        baseline()
        return 0
    data = corpus()
    if args.command == "extract":
        extract(data)
    elif args.command == "align":
        write_alignment(data)
    else:
        term_stats(data)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
