# 翻译润色记录

## 范围与基线

- 文体：以信息传达为主的软件设计教材，兼有作者论述；自由度约 4/10，准确优先。
- 基线：`4362314d5bb8eedbe2a088f950850a187b3f8641`。任务开始时工作区干净；另有原始文件快照 `/tmp/aposd2e-polish.GHV1eo/`，已与该提交交叉核对。恢复任务时已有四章改动，统计仍使用原始提交，未把改后文本当作基线。
- `baseline.json` 保存原始 99 个受版本控制文件的 SHA-256；不因后续编辑重建基线。
- 英文 `docs/en/`、代码、标识符、数字、链接、图片、HTML、脚注标识和章节顺序受保护。保留原有分语言目录与 VuePress 构建方式；新增译注和经原文确认的少量转录修复单独登记，不放宽整套检查。
- `docs/zh-tw/` 是生成产物，沿用 OpenCC 1.4.1 及现有词汇规则生成；不另立人工译本。
- 第一阶段只有仓库英文摘录，因此缺源处仅作中文润色。随后用户提供完整 EPUB，已对前言、22 章正文与总结补做全文核对。`docs/en/` 仍保持原有公开摘录，未将完整英文加入仓库。
- 完整原文：Downloads 中的 `a-philosophy-of-software-design-2nd.epub`，SHA-256 为 `9f587b71073a53a7813f4048669ee80ec3183eedd8eeb43736add7601d6b3d21`。`epub-source.json` 记录内部文件哈希。提取稿仅存于 `/tmp/aposd2e-polish.GHV1eo/original/`，可用下方命令重建。

## 术语统计

先提取候选，再逐项核对语境并裁定，最后恢复分章润色。现有译者术语表是证据之一，不用它替代语料统计。

| 文件 | 用途 |
| --- | --- |
| `english-candidates.tsv` | NLTK 词性标注、WordNet 词形归并后，出现至少两次的名词及 2–5 词短语候选 |
| `chinese-candidates.tsv` | jieba 加入术语表词典后的中文候选，正文至少出现三次 |
| `paired-chinese-candidates.tsv` | 仅对已确认对应的中文文本块分词，至少出现两次 |
| `terms.tsv` | 人工裁定的 81 项术语及专业表达，含词形、译法、义项、易混概念、原文位置和状态 |
| `term-counts.tsv` | 上述条目在保留英文、全部中文正文中的次数、覆盖文件数、变体和全部位置 |
| `paired-term-counts.tsv` | 限定在已对齐文本块中的双语计数 |
| `coverage.tsv` | 全部中文小节的英文覆盖；同数仅是结构候选，不自动算核验通过 |
| `alignment-decisions.json`、`alignments.tsv` | 人工确认的对应规则及绑定基线内容哈希的文本块标识 |
| `epub-english-candidates.tsv`、`epub-term-counts.tsv` | 完整 EPUB 的候选及术语统计，与最初摘录统计分开 |
| `epub-coverage.tsv` | 完整 EPUB 的结构对照表；计数标记只是机器生成的对应候选，不代替下述人工复核记录 |
| `errata.json` | 10 条新增可见译注的原文位置、完整注释及外部核实来源 |
| `source-corrections.json` | 5 项有原文依据的保护例外：副标题、变量名、搜索串和两处代码转录遗漏 |

计数口径：

- 只取 Markdown 解析器识别的正文文本，含正文列表和引文。排除标题、代码块、行内代码、HTML、图片、URL、邮件地址、README 目录和译者术语表。不重复统计繁体派生文本或仓库根目录的简介。
- 初始摘录语料为 233 个英文文本块、777 个中文文本块，曾有 93 个小节缺英文正文。完整 EPUB 提取出 763 个正文文本块、464 个文本代码块、173 个标题和 14 个警示标签；额外的表格代码和代码图片直接核对 EPUB。块数不是自然段数，不能据此计算缺译比例。
- EPUB 通过 XML 解析器与 CSS 字体规则区分正文和代码，不包含封面、版权页、目录、索引等书外导航内容。正文频次不计等宽字体的行内标识符。正文代码图片不做 OCR 词频统计。仓库简介仍与原有英文简介核对。
- 自动候选不是最终术语，可能包含普通名词、专名或误标词。原始词形另列；保留连字符、缩写及 C++，缩写不作普通复数还原。
- 人工术语计数采用 `en_forms` 明列的大小写不敏感词边界匹配，**不受词性标注结果限制**。同一条目内长别名优先，重叠处只计一次；不同条目可重叠，不能相加当作总词数。
- 中文计数是候选字串的出现次数，**不是已经证明对应某个英文义项的次数**。“方法”包含普通做法，“功能”不都对应 function，“通用”也不都对应 general-purpose。义项判断看 `terms.tsv` 的证据与边界。
- `term-counts.tsv` 的英文频次只代表仓库摘录；`epub-term-counts.tsv` 才是完整正文口径。TDD 在摘录正文中为零，完整正文中为 4 次；dispatcher 分别为零和 7 次。不能混用两个分母。
- 独立分词检索复核了摘录中的 `complexity` 84 次和 `specialization`（含 over-specialization）15 次，与条目计数一致；完整 EPUB 中 complexity 为 214 次。候选词表只取特定词性，故可能与完整词形别名计数不同。

对齐已逐段按内容核对，不仅比较块数。特殊分组：

- 第 1 章英文副标题在原始中文中缺失，已按 EPUB 补回；原始对齐表仍保留基线的缺口，不改写历史统计。
- 第 3 章中文副标题对应英文标题内括注，不属于新增正文。
- 第 5 章多出的中文块是译者注，不删除。
- 第 6.2 节英文第 2–4 块对应中文第 2–3 块，存在跨段分句合并，不强拆成一对一。
- 第 12 章英文最后一个借口与后续说明同段，中文分为两块。

## 已确认的取舍

- `specialization` 用“专用化”，不译“专业化”；`common-case code` 是处理常见情况的代码，不等于通用代码。
- 保留“复杂性”“模糊性”“信息泄露”“透传”“深／浅模块”等既有约定。时间顺序分解可简称时间分解，不机械消灭合理变体。
- function、method、functionality、approach 分别按函数、方法、功能、做法或方案判断；不做全局字面替换。
- `selection` 区分选择动作、区域选择机制和所选区域；优先既有自然译法，不全书强换成“选区”。
- undo 统一为“撤销”；代码中的 undo、redo 等标识符保持不变。
- `leverage` 按语境解释复用已有知识或机制带来的收益，不与“认知负荷”混同；`centrality` 指核心地位，不是集中式架构。
- 第 13 章主题是补足仅从代码中不易看出的信息，不是只解释难懂代码。
- “有针对性的注释”不与战略式编程混作术语；Raft 示例的 current term 指当前任期。
- 保留作者的限定条件、主观判断及与《代码整洁之道》的分歧，不将 can、may、seem 等改成确定结论。

## 全文复核

四组分章复核均先完成术语与对应关系检查，再编辑；取得完整 EPUB 后，再核对此前缺源的部分。主任务负责第 1–2 章、前言、简介、总结、统一标题与译注，以及最终整合。

| 范围 | 全文复核与主要修正 |
| --- | --- |
| 前言、1–2、简介、总结 | 全文核对；补回前言漏句及第 1 章副标题；修正函数、复杂性定义中的结构限定、时间比例权重及变更放大段落漏句 |
| 3–7 | 全部正文、小节、图注、脚注、代码；修正接口成本、专用化、常见情况、选择范围、内部表示、条件的“或”关系 |
| 8–12 | 全部正文、引文、图注、代码；修正单处代码与单例的混淆、索引位置、异常恢复、键入时间及作者论断的限定 |
| 13–17 | 全部正文、警示、代码；另核对 XHTML 表格中的 8 行代码；修正注释原则、比较函数、统一命名、诊断信息、不变量及跨模块记录含义 |
| 18–22 | 全部正文、图注、文本代码与第 20 章代码图片；修正对象分配、任期、TDD 立场、分配区域、性能倍数及重要性论述 |

## 译注与边界

按用户要求，原书表述保留，注释放在对应段落旁：

- 已核实的勘误：ObjectInputStream 读写功能、HTTP 请求行、History.redo、History.Action 类型关系、字节与字符、Python 越界切片、List 接口关系，共 7 条。
- 以疑点标注而非断言勘误：战略式编程的初期收益、`methods of variables`，共 2 条。
- 跨章术语说明：面向字符接口的操作粒度，1 条。
- Java 类关系和流行为核对 Oracle 官方文档；请求行核对 RFC 9112；Python 切片核对官方序列文档。其余依据 EPUB 上下文及本书代码。来源记录在 `errata.json`。

这次完成的是翻译复核，不是对原书所有技术论断作独立审计。仍保留的待考证问题包括：Parnas 文献的不同年份、Linux `sock`／`socket` 的历史结构关系，以及 Windows 删除、TCP 交付、NFS 重试和内存耗尽等概括的完整适用条件。未将这些概括标记为已验证的普遍事实，也未改写作者观点。`Go!` 等原文标点和零散排印问题未作无依据纠正。

## 进度

用户追问后进行了独立二次复核，发现并修正 6 处语义问题，其中 4 处由初次润色引入、2 处为既有漏检。详见 `second-pass.md`。下表的“一轮完成”不等同于没有翻译错误。

| 阶段 | 状态 |
| --- | --- |
| 原始基线与保护范围 | 已完成；原始哈希不变，新增内容与转录修复单独核验 |
| 候选提取、术语裁定、对应关系 | 已完成；81 项，摘录与完整 EPUB 口径分列 |
| 样章校准 | 已完成，第 1 章 |
| 分章润色与主任务复核 | 已完成；前言、22 章、简介、总结均复核 |
| 繁体同步与保护检查 | 25 个文件同步一致；保护检查零失败；git diff --check 通过 |
| 构建 | VuePress 构建成功，76 个页面 |
| 审计器测试 | 6 项测试通过，含保护范围、别名重叠、EPUB 代码识别和切片勘误示例 |
| 构建产物 | 中、繁体共 20 处译注实际出现在 HTML 中；174 个本地链接及资源目标均存在 |

本轮已启动本地预览：`http://127.0.0.1:8081/aposd2e-zh/`，第 6 章页面返回 HTTP 200。该服务状态仅代表本轮，后续恢复任务时需重新确认。未提交、推送或部署。

## 复核命令

在仓库根目录执行；审计依赖独立于网站运行依赖：

```sh
python3 -m venv /tmp/aposd-review-venv
/tmp/aposd-review-venv/bin/pip install -r review/translation/requirements.txt -r requirements.txt
/tmp/aposd-review-venv/bin/python -m nltk.downloader -d /tmp/aposd-review-nltk averaged_perceptron_tagger_eng wordnet
NLTK_DATA=/tmp/aposd-review-nltk /tmp/aposd-review-venv/bin/python review/translation/audit.py extract
/tmp/aposd-review-venv/bin/python review/translation/audit.py align
/tmp/aposd-review-venv/bin/python review/translation/audit.py terms
NLTK_DATA=/tmp/aposd-review-nltk /tmp/aposd-review-venv/bin/python review/translation/epub_source.py "$HOME/Downloads/a-philosophy-of-software-design-2nd.epub" /tmp/aposd-original --candidates
/tmp/aposd-review-venv/bin/python -m unittest discover -s review/translation -p 'test_*.py'
/tmp/aposd-review-venv/bin/python review/translation/audit.py check
/tmp/aposd-review-venv/bin/python bin/zh-tw.py --check
npm run build
```

审计保护检查只能证明受保护内容未变，不能替代人工语义复核。新增译注必须与登记文本完全一致才可排除；转录修复只允许登记的精确片段。统计始终绑定原始提交和指定 EPUB，不通过刷新基线消除检查失败。

## 后续阅读器改造检查点

用户新增要求：

1. 参考 `/Volumes/Archive/Dev/python/Software-Engineering-at-Google` 美化页面。
2. 按翻译技能为每章增加解释性 SVG；“每一张”按每章理解。
3. 增加原书示例与 Python 教学改写的切换选项，不覆盖原书代码。
4. 将正文低分辨率原图复现为 SVG，增加独立切换选项。
5. 增加随文解释图，再由独立 agents 审查、修改，反复检查 HTML 可读性。

已检查参考项目 `assets/reader.css`、`assets/reader.js` 开头及 `reader-light.png`、`reader-dark.png`。方向是灰绿色浅色底、近黑深色模式、宋体正文、236px 章节栏、680px 阅读栏、右侧本章目录、低干扰控制栏。保留本项目 VuePress 与现有章节 URL，不迁移到 Docsify。

样章选第 4 章：包含正文、列表、原书图片、代码与译注。先验证共享阅读器及一张解释图，再扩展各章。图解和 Python 改写是新增教学层，必须标明不是原著内容。

Markdown 解析器识别出 44 个标为 java 的代码块，包含引用中的示例；有些实际是 C++ 片段。UI 应用“原例／Python”而非假定所有原例都是 Java。Python 改写需逐块按概念制作，校验源代码哈希，保留反例的教学目的，并说明无法一一对应的语言差异。

本轮未使用付费 Image Gen；直接以参考截图和 CSS 为视觉规范。主任务使用 Playwright 与本机 Chrome 验证实际页面。

共享阅读器、44 个源代码哈希锁定的 Python 教学改写、原图/SVG 偏好已接入。
最初的 61 张解释图经独立审查后，修改或重画薄弱图、撤下 12 张重复或误导图，并新增一张有明确前提的收尾例子；现有 50 张，覆盖全部 22 章。简繁体和桌面/手机版共 200 个解释性 SVG，另有 12 个原图 SVG 复现。所有原图与原著代码均保留。
独立复核已接受全部 50 张解释图与 12 张原图复现。繁体新增图文的 2,589 个文字对另行复核，9 类误转已修正；Python 改写复核的 3 个问题也已修正。未做真实读者理解实验，不能据此声称已测得学习效果。
目录、手机溢出、弹窗 hydration、失败回退、键盘焦点和冷启动锚点等实际问题已修复并复测。整书 300 个页面状态和 212 个 SVG 资源两主题检查通过；正文末次 B1 词义修正的补充验证记录见阅读器验收文档。
全部 25 个繁体正文与生成规则同步；新增“不變條件”、测试“通過”等语境规则后，保护检查仍为零失败。阅读器的最终范围、限制与证据集中在 `review/reader/README.md`，历史检查点单列保存。未提交、推送或部署。
