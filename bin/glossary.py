#!/usr/bin/env python3
"""Render review/translation/terms.tsv as a readable glossary at review/translation/glossary.md.

terms.tsv is the adjudicated term list kept during the translation review (English, preferred
Chinese rendering, forms, seen variants, sense, distinction, evidence, status). This script only
formats it; edit the TSV, then rerun. `--check` fails when glossary.md is stale (used by CI).
"""

import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERMS = ROOT / "review/translation/terms.tsv"
OUTPUT = ROOT / "review/translation/glossary.md"

HEADER = """# 术语表

本表由 `bin/glossary.py` 从 `terms.tsv` 生成，列出译本审校时人工裁定的术语。每一条给出首选译法、它在本书中的义项，
以及使用边界（哪些语境不适用、容易和什么混淆）。首选译法只在注明的义项内适用，不是全局替换规则；
同一个英文词在普通英语义项下仍按上下文翻译。证据位置、词形和已见异译见 `terms.tsv`。

| 英文术语 | 首选译法 | 义项 | 使用边界 | 状态 |
| --- | --- | --- | --- | --- |
"""


def cell(value):
    return value.replace("|", "／").replace("\n", " ").strip()


def render():
    with TERMS.open(encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle, delimiter="\t"))
    lines = [HEADER.rstrip("\n")]
    for row in rows:
        lines.append("| " + " | ".join(cell(row[key]) for key in ("english", "preferred_zh", "sense", "distinction", "status")) + " |")
    lines.append("")
    lines.append(f"共 {len(rows)} 条。")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="fail if glossary.md is stale")
    args = parser.parse_args()
    content = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise SystemExit("review/translation/glossary.md is stale; run python3 bin/glossary.py")
        print("glossary.md is up to date")
        return
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
