import unittest
import xml.etree.ElementTree as ET

from audit import blocks, hits, protected
from epub_source import code_classes, prose


class AuditTests(unittest.TestCase):
    def test_corpus_excludes_navigation_code_and_urls(self):
        text = """# Intro

Software **design** uses `code` and [modules](https://example.test/design).

```python
complexity = 3
```

![complexity](figures/test.png)

## Contents
- [Complexity](ch02.md)
"""
        found = blocks("docs/en/README.md", text)
        self.assertEqual(len(found), 1)
        self.assertIn("Software design uses", found[0]["text"])
        self.assertNotIn("complexity", found[0]["text"])
        self.assertNotIn("https", found[0]["text"])
        self.assertNotIn("code", found[0]["text"])

    def test_table_quote_and_nested_link_destinations_are_protected(self):
        text = """# 标题

正文 `value` [链接](https://example.test/a_(b))。

> 中文引文与 English quotation。

| 名称 | 示例 |
| --- | --- |
| 条目 | `x` |

<img src="figures/a.png" width="20" />

```java
// 中文注释属于代码，不可润色
int x = 1;
```
"""
        self.assertEqual(protected(text), protected(text.replace("正文", "说明")))
        for before, after in [
            ("int x = 1", "int x = 2"),
            ("`value`", "`other`"),
            ("a_(b)", "a_(c)"),
            ("figures/a.png", "figures/b.png"),
            ("English quotation", "English replacement"),
            ("中文注释属于代码", "更改了代码注释"),
        ]:
            with self.subTest(before=before):
                self.assertNotEqual(protected(text), protected(text.replace(before, after)))

    def test_aliases_use_longest_match_and_english_word_boundaries(self):
        data = [{"text": "classes class classical", "path": "a", "line": 1}]
        found, variants = hits(data, ["class", "classes"], True)
        self.assertEqual(sum(n for _, n in found), 2)
        self.assertEqual(variants, {"classes": 1, "class": 1})
        data[0]["text"] = "代码缺陷和缺陷"
        _, variants = hits(data, ["缺陷", "代码缺陷"], False)
        self.assertEqual(variants, {"代码缺陷": 1, "缺陷": 1})

    def test_section_keys_are_language_independent(self):
        en = blocks("docs/en/summary.md", "# Summary\n\n## Principles\n\nText.\n")
        zh = blocks("docs/summary.md", "# 总结\n\n## 原则\n\n正文。\n")
        self.assertEqual(en[0]["section"], zh[0]["section"])

    def test_epub_code_is_identified_from_styles(self):
        css = ".body {font-family: Reg} .code {font-family: lucidasanstypewriter}"
        self.assertEqual(code_classes(css), {"code"})
        node = ET.fromstring('<p>Read <span class="code">value</span> first.</p>')
        self.assertEqual(prose(node, {"code"}), "Read   first.")

    def test_python_slice_erratum_examples(self):
        self.assertEqual([1, 2, 3][1:99], [2, 3])
        self.assertEqual([1, 2, 3][99:], [])


if __name__ == "__main__":
    unittest.main()
