"""Static checks for trusted repository-authored reader assets, not an SVG sandbox."""

import argparse
import ast
from collections import Counter
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
READER = ROOT / "docs/.vuepress/reader"
PUBLIC = ROOT / "docs/.vuepress/public"


def collection(kind):
    entries = []
    for file in sorted((READER / kind).glob("*.json")):
        data = json.loads(file.read_text())
        entries.extend(data if isinstance(data, list) else [data])
    return entries


def marked_path_issues(root):
    issues = []

    def visit(node, start=None, end=None):
        start = node.get("marker-start", start)
        end = node.get("marker-end", end)
        if node.tag.rsplit("}", 1)[-1] == "path":
            data = node.get("d", "")
            if any(value and value != "none" for value in [start, end]) and len(re.findall("[Mm]", data)) > 1:
                issues.append(data)
        for child in node:
            visit(child, start, end)

    visit(root)
    return issues


def check_svg(asset):
    file = PUBLIC / asset.lstrip("/")
    root = ET.fromstring(file.read_text())
    assert root.tag == "{http://www.w3.org/2000/svg}svg", f"{asset}: SVG namespace"
    box = [float(value) for value in root.attrib["viewBox"].split()]
    assert len(box) == 4 and all(math.isfinite(value) for value in box) and min(box[2:]) > 0, asset
    ids = [node.attrib["id"] for node in root.iter() if "id" in node.attrib]
    assert len(set(ids)) == len(ids), f"{asset}: duplicate IDs"
    tags = [node.tag.rsplit("}", 1)[-1] for node in root.iter()]
    assert "title" in tags and "desc" in tags, f"{asset}: missing accessible title/description"
    assert not marked_path_issues(root), f"{asset}: split marked subpaths so each intended endpoint is explicit: {marked_path_issues(root)}"
    for node in root.iter():
        tag = node.tag.rsplit("}", 1)[-1]
        assert tag not in {"script", "foreignObject", "image", "iframe", "animate", "set"}, f"{asset}: unexpected {tag}"
        for key, value in node.attrib.items():
            key = key.rsplit("}", 1)[-1]
            assert not key.lower().startswith("on"), f"{asset}: event attribute"
            if key == "href":
                assert value.startswith("#") and value[1:] in ids, f"{asset}: nonlocal reference {value}"
            for target in re.findall(r"url\(([^)]+)\)", value):
                assert target.startswith("#") and target[1:] in ids, f"{asset}: reference {target}"
            if key in {"aria-labelledby", "aria-describedby"}:
                assert set(value.split()) <= set(ids), f"{asset}: accessibility reference"
    return box


def verify(complete=False, epub_blocks=None):
    diagrams = collection("diagrams")
    figures = collection("figures")
    examples = collection("examples")
    ids = [item.get("id", item.get("chapter")) for item in diagrams]
    assert len(ids) == len(set(ids)), "Duplicate active diagram IDs"
    sources = {entry["id"] for entry in json.loads(epub_blocks.read_text())} if epub_blocks else None
    checked = set()
    for item in diagrams:
        for field in ["id", "chapter", "title", "question", "answer", "summary", "alt", "kind", "anchor", "sources"]:
            assert item.get(field), f"{item.get('id', item.get('chapter'))}: missing {field}"
        assert item.get("status") != "retire", f"{item['id']}: retired diagram still active"
        for source in item["sources"]:
            assert source.get("section") and source.get("reason"), f"{item['id']}: weak source reference"
            if sources and source.get("epub"):
                assert source["epub"] in sources, f"{item['id']}: unknown EPUB paragraph {source['epub']}"
        for layout in ["desktop", "mobile", "desktopTw", "mobileTw"]:
            if layout in item:
                check_svg(item[layout])
                checked.add(item[layout])
            elif complete:
                raise AssertionError(f"{item['id']}: missing {layout}")
    names = [item["original"] for item in figures]
    assert len(names) == len(set(names)), "Duplicate original figure mappings"
    for item in figures:
        assert (ROOT / "docs/figures" / item["original"]).is_file(), item["id"]
        box = check_svg(item["vector"])
        assert box[2:] == [item["width"], item["height"]], f"{item['id']}: wrong geometry metadata"
        assert item["kind"] in {"figure", "formula", "icon"} and item.get("fidelityNotes") and item.get("source"), item["id"]
        checked.add(item["vector"])
    for item in examples:
        compile(ast.parse(item["python"], filename=item["id"]), item["id"], "exec")
        if complete:
            assert item.get("noteTw"), f"{item['id']}: missing traditional note"
    if complete:
        assert {item["chapter"] for item in diagrams} == {f"ch{i:02}" for i in range(1, 23)}, "Incomplete chapter coverage"
        originals = {file.name for file in (ROOT / "docs/figures").iterdir() if file.name != "cover.jpeg" and file.is_file()}
        assert set(names) == originals, f"Original figure coverage differs: {set(names) ^ originals}"
        assert len(examples) == 60, "Incomplete teaching code variants"
    print(json.dumps({
        "teaching_diagrams": len(diagrams),
        "chapter_counts": dict(sorted(Counter(item["chapter"] for item in diagrams).items())),
        "original_vectors": len(figures), "svg_assets_checked": len(checked),
        "python_examples_parsed": len(examples),
        "scope": "static only; no geometry, semantics, browser or reader-learning verdict",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--complete", action="store_true")
    parser.add_argument("--epub-blocks", type=Path)
    args = parser.parse_args()
    verify(args.complete, args.epub_blocks)
