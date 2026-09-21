# tools

阅读器内容的校验、生成辅助和浏览器验收脚本。生成脚本在 `bin/`（`zh-tw.py` 繁体转换、`chapter_figures.py` 章首概览与章末回顾、`glossary.py` 术语表）。

| 脚本 | 用途 | 运行方式 |
| --- | --- | --- |
| `test_content.mjs` | 图解锚点、代码示例源锁定、章节清单等内容契约 | `npm test` |
| `test_references.mjs` | 小节引用与脚注往返链接 | `npm test` |
| `test_examples.py`、`test_native_examples.py` | 60 段 Python 教学改写可解析，部分可执行 | `python3 -m unittest discover -s tools -p 'test_*.py'` |
| `test_localize.py`、`test_svg.py` | 繁体本地化规则、SVG 箭头标记检查 | 同上（需要 `opencc==1.4.1`） |
| `localize.py` | 从简体图解生成繁体 SVG 与元数据；`--check` 供 CI 使用 | `uv run --with opencc==1.4.1 python3 tools/localize.py` |
| `verify.py` | 图解、原图复现、代码改写的静态检查；`--complete` 要求全书覆盖 | `python3 tools/verify.py --complete` |
| `browser.mjs`、`interactions.mjs`、`resilience.mjs` | 用本机 Chrome 对构建产物做页面、交互和容错验收 | 见 `review/reader/README.md` 的 Reproduce 一节 |

审校记录与验收结论在 `review/`。
