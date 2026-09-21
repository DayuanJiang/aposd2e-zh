"""Generate traditional-Chinese labels without changing SVG geometry or identifiers."""

import argparse
import json
from pathlib import Path
import runpy
import xml.etree.ElementTree as ET

import opencc

ROOT = Path(__file__).resolve().parents[1]
READER = ROOT / "docs/.vuepress/reader"
PUBLIC = ROOT / "docs/.vuepress/public"
conversion = runpy.run_path(str(ROOT / "bin/zh-tw.py"))
rules = conversion["load_rules"]()
converter = opencc.OpenCC("s2twp.json")
ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")


def translate(text):
    return conversion["apply_rules"](converter.convert(text), rules)


def localize_svg(source):
    root = ET.fromstring(source)
    for node in root.iter():
        if node.tag.rsplit("}", 1)[-1] in {"title", "desc", "text", "tspan"} and node.text:
            node.text = translate(node.text)
        if node.tail and node.tail.strip():
            node.tail = translate(node.tail)
    return ET.tostring(root, encoding="unicode") + "\n"


def generate(check=False):
    stale = []
    count = 0

    def output(path, value):
        nonlocal count
        count += 1
        if check:
            if not path.exists() or path.read_text() != value:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.write_text(value)

    for kind in ["diagrams", "examples"]:
        for file in sorted((READER / kind).glob("*.json")):
            data = json.loads(file.read_text())
            entries = data if isinstance(data, list) else [data]
            for entry in entries:
                for field in (["title", "question", "answer", "summary", "alt"] if kind == "diagrams" else ["note"]):
                    if field in entry:
                        entry[field + "Tw"] = translate(entry[field])
                if kind == "diagrams":
                    for layout in ["desktop", "mobile"]:
                        source = PUBLIC / entry[layout].lstrip("/")
                        destination = source.with_stem(source.stem + "-tw")
                        entry[layout + "Tw"] = "/" + str(destination.relative_to(PUBLIC))
                        output(destination, localize_svg(source.read_text()))
            output(file, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    if stale:
        raise SystemExit("Stale localized assets:\n" + "\n".join(stale))
    print(f"{'Checked' if check else 'Generated'} {count} localized assets/metadata files")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    generate(parser.parse_args().check)
