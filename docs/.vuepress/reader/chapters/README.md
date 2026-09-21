# 章首概览与章末回顾：内容数据格式

每章一个文件 `chNN.json`。运行 `python3 bin/chapter_figures.py --only chNN` 校验并生成该章的四张 SVG
（概览桌面版、概览手机版、回顾桌面版、回顾手机版），同时把两条阅读器条目合并进
`../diagrams/chapter-figures.json`。文字超出版式预算时脚本会报错并指出哪一段太长。
繁体版由 `tools/localize.py` 之后统一生成，这里只写简体。繁体常比简体长（“代码”会变成“程式碼”），所以脚本按简繁两版中较宽者核对预算；请用 `uv run --with opencc==1.4.1 python3 bin/chapter_figures.py --only chNN` 运行，没有 opencc 时脚本只按简体核对。

## 顶层结构

```json
{
  "chapter": 4,
  "sourceSections": ["4.1 模块化设计", "4.2 接口中有什么？"],
  "sources": [
    { "section": "4.3", "reason": "抽象的定义与两类错误" }
  ],
  "map": { ... },
  "story": { ... }
}
```

- `sources`：至少一条，每条要有 `section`（如 `"4.3"`，导言用 `"intro"`）和 `reason`（这一节支撑了图中哪个判断）。
- `sourceSections`：参考用，列出图解覆盖的小节标题。

## 概览 `map`

```json
{
  "form": "pipeline",
  "question": "这一章回答的问题（不超过 22 个汉字）",
  "answer": "一句话答案（不超过 55 个汉字）",
  "parts": [
    { "icon": "layers", "label": "标签（2 到 6 字）", "text": "一句说明（见各版式的字数上限）" }
  ],
  "figure": { ... 随版式不同 ... }
}
```

`question` 是图的大标题，也是这一章要回答的问题；`answer` 出现在图底部的“一句话”色块里。
`parts` 是这章的几块主要内容，图标名只能用 `icons.json` 里的 76 个（lucide 图标名）。

七种版式，按“这章的内容之间是什么关系”来选：

| form | 适用关系 | parts 数量 | figure 字段 |
| --- | --- | --- | --- |
| `pipeline` | 几步依次做 | 3 到 5 | 可选 `header`、`footer` |
| `pillars` | 几个并列的支柱共同支撑一个目标 | 3 到 5 | `goal: { label, text }` |
| `contrast` | 两种做法对照，右边是本章主张 | 恰好 2（左、右各一） | `left`、`right`: `{ icon, title, tone, items[] }`，可选 `header`、`footer`、`arrow` |
| `layers` | 分层，`parts` 从底层到顶层 | 2 到 4 | 可选 `header`、`footer`、`side`、`widths[]` |
| `cycle` | 循环往复 | 3 到 5 | 可选 `header`、`footer` |
| `socket` | 一个东西有一个“插口”，几种东西可以插进去 | 3 到 5 | `box: { icon, label, text }`、`socket: { label, text }`、`header`、`footer`，可选 `highlight`（下标）、`bracket: { from, label }` |
| `axes` | 两个变化方向构成坐标，从一个起点走到一个区域 | 至少 3：前两项是横轴与纵轴，其余是区域内的要点 | `xTicks[2]`、`yTicks[2]`、`origin: { icon, label, text }`、`arrow`、`region: { label, text, icon? }`，可选 `itemsLabel`（手机版区域要点的小标题，默认“在这里要注意的事”） |

`tone` 可选 `pri`（本章主张，绿）、`sec`（中性，蓝）、`warm`（提醒，棕）、`danger`（反例，红）。

### 整图总量

概览是读前地图，图上实际画出来的文字（question、answer、各 part 的 label 与 text、figure 里的说明；contrast 版式的 parts 只进无障碍描述，不计）合计不得超过 160 个汉字，脚本会检查。目标是一百二十字左右：每个 part 的 text 一句话、不超过 16 字，header 不超过 25 字，footer 通常省略，answer 不超过 40 字。

### 各版式的字数上限（汉字数，英文按半个字算）

- `pipeline`：`label` ≤ 10；`text` 4 步时 ≤ 36，5 步时 ≤ 27；`header` ≤ 59；`footer` ≤ 64。
- `pillars`：`label` ≤ 10（5 柱时 ≤ 7）；`text` 4 柱时 ≤ 48，5 柱时 ≤ 36；`goal.label` ≤ 40；`goal.text` ≤ 53。
- `contrast`：`title` ≤ 17；每条 `items` ≤ 23，两边条数尽量相同（最多 5 条）；`arrow` ≤ 4；`header` ≤ 59；`footer` ≤ 64。
- `layers`：`label` ≤ 20；`text` 满宽时 ≤ 54，`widths` 变窄时相应变短（宽 400 时 ≤ 21）；`side` ≤ 60。
- `cycle`：`label` ≤ 12；`text` ≤ 48；`header` ≤ 59；`footer` ≤ 64。
- `socket`：`box.label` ≤ 14；`box.text` ≤ 18；`socket.label` ≤ 6；`socket.text` ≤ 11；`header` ≤ 29；插头 `label` ≤ 5；插头 `text` ≤ 18；`footer` ≤ 33；`bracket.label` ≤ 2。
- `axes`：横轴与纵轴的 `label：text` 合计 ≤ 18；`origin.text` ≤ 13；`arrow` ≤ 9；`region.label` ≤ 12；`region.text` ≤ 28；区域项 `text` 2 项时 ≤ 10。

手机版会把所有 `parts` 排成竖列，每项 `label` ≤ 16、`text` ≤ 60，一般不会成为瓶颈。

## 回顾 `story`

```json
{
  "headline": "用一句话重讲这一章（不超过 32 个汉字）",
  "acts": [
    { "act": "起点", "icon": "terminal", "tone": "sec", "title": "这一幕的小标题（≤ 34 字）", "text": "这一幕讲了什么（≤ 80 字）" }
  ],
  "emphasis": "这一章最想强调的主张（≤ 40 字）",
  "emphasis2": "补一句限定或推论（≤ 52 字）"
}
```

- 3 到 6 幕，推荐 4 幕；`act` 是 2 到 3 个字的幕名（如 起点、问题、转折、做法、结论）。
- 每幕一个 `tone`：铺垫用 `sec`，问题或反例用 `warm` 或 `danger`，本章主张用 `pri`。

## 写作要求

- 面向第一次读这本书的中文工程师，用日常语言，不堆术语，不用比喻和暗示。
- 每个判断都要能在本章正文里找到依据；作者带前提的建议，不能写成绝对规则。
- 术语沿用正文译法（见 `review/translation/glossary.md`）：复杂性、深模块、信息隐藏、通用接口、透传方法、危险信号、通过定义来规避错误 等。
- 标点用全角，句末可不加句号；不使用破折号。

## 边界说明 `limits`（可选）

审校者写给自己的边界说明（例如“图示不代表实测成本”“本例不证明全部情况”）不进图。需要记录时写在顶层 `limits` 数组里，
生成脚本会把它原样带进阅读器元数据（`../diagrams/chapter-figures.json`），页面上不显示。

```json
{ "limits": ["概览中的步骤顺序是整理方式，正文未规定固定顺序"] }
```
