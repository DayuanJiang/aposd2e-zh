<div align="center">

<img src="./docs/figures/cover.jpeg" alt="A Philosophy of Software Design 封面" width="150">

# 软件设计的哲学（第二版）中文版

**《A Philosophy of Software Design, 2nd Edition》中文翻译 · 图解阅读版**

对照原文修订的译文，每章配有译者图解、章首概览与章末回顾，代码示例一键切换为 Python，简体与繁体双版。

[![在线阅读](https://img.shields.io/badge/在线阅读-dayuanjiang.github.io-a33e36?style=flat-square)](https://dayuanjiang.github.io/aposd2e-zh/)
[![全书修订](https://img.shields.io/badge/22%20章-全部对照原文修订-0b6f5d?style=flat-square)](#目录)
[![CC BY 4.0](https://img.shields.io/badge/译文-CC%20BY%204.0-555?style=flat-square)](#来源与许可)
[![CI](https://github.com/DayuanJiang/aposd2e-zh/actions/workflows/CI.yml/badge.svg)](https://github.com/DayuanJiang/aposd2e-zh/actions/workflows/CI.yml)

<br>

<a href="https://dayuanjiang.github.io/aposd2e-zh/ch04.html">
  <img src=".github/readme/reader-light.png" alt="阅读器：第 4 章开头的本章概览，浅色主题" width="900">
</a>

</div>

<br>

## 这本书讲什么

为什么代码越写越难改？为什么一个小需求会牵连十几个文件？为什么每个类都很短，整个系统却没人敢动？

斯坦福大学教授、Tcl 语言的作者 John Ousterhout 用一本篇幅不长的书回答了这些问题：软件设计的核心任务，是控制复杂性。全书围绕这一把尺子，讨论每个程序员每天都要面对的决定：模块该切多大，接口怎样才算好，注释该写什么，名字怎么取，异常怎样处理，什么时候值得多花一点时间把设计做对。它提供的是一套判断方式。读完之后再看自己的代码，感觉会不一样。

## 这个仓库做了什么

这个仓库在社区译稿的基础上，对照第二版英文原文逐段修订了全部 22 章、前言和总结，并为中文读者写了一个专门的阅读器：每章开头一张概览、结尾一张回顾，正文中穿插译者图解，原书的 Java 与 C++ 示例都配有 Python 对照。审校记录、术语裁定和验收数据完整保留在仓库里。

<div align="center">

| 中文译文 | 译者图解 | 章首概览与章末回顾 | 原图重绘 | Python 对照 | 术语表 |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 约 8.2 万字 | 50 幅 | 22 章各一组 | 12 幅 | 60 段 | 81 条 |

</div>

## 特色

- **译文对照原文修订。** 理顺生硬句式的同时，逐句核对条件、否定、因果与适用范围，保留作者的论证与分歧。核心术语全书统一，并区分容易混淆的含义：例如“深模块”的“深”与软件层级无关，“复杂性”也不等于算法的时间复杂度。裁定过的译法都记录在[术语表](review/translation/glossary.md)里。
- **每章开头一张概览，结尾一张回顾。** 概览回答“这章讲什么、几块内容怎么关联”，回顾用几幕故事重讲这章想强调什么。两者都从每章的内容数据生成，桌面和手机各有一套版式。
- **50 幅译者图解穿插正文。** 用模块边界、状态变化和调用关系，把抽象原则画出来：为什么这个接口更深，为什么那个特殊情况可以消失，一次内部修改会波及多远。全部是 SVG，可放大、可下载，随浅色与深色主题变色。
- **原书插图的矢量重绘。** 12 幅原书低分辨率插图都有可放大的 SVG 版本，也可以一键切回原图对照。
- **60 段代码示例的 Python 对照。** 原书示例以 Java、C 与 C++ 为主。每段示例右上角有“原例 | Python”标签，点一下切换全书示例的语言。改写保留原例中的设计反例，并注明语言语义上的差异。
- **读起来舒服。** 简体与繁体切换，浅色与深色主题，正文字号 16 至 22 像素可调，全书搜索，右侧本章目录随滚动高亮，顶部有阅读进度条，脚注与正文之间可以往返跳转。偏好和上次读到的章节保存在浏览器里，回到简介页可以直接继续。

## 开始阅读

在线版本：<https://dayuanjiang.github.io/aposd2e-zh/>（繁体：<https://dayuanjiang.github.io/aposd2e-zh/zh-tw/>）

本地运行：

```bash
git clone https://github.com/DayuanJiang/aposd2e-zh.git
cd aposd2e-zh
npm ci
npm run dev      # 启动本地预览
npm run build    # 构建静态站点到 docs/.vuepress/dist
```

如果只想读文字，[`docs/`](docs/) 目录下的 Markdown 在 GitHub 上直接点开就能看。

## 阅读器一览

<table>
  <tr>
    <td align="center"><img src=".github/readme/reader-light.png" alt="浅色主题：第 4 章开头的本章概览" width="440"><br><sub>浅色主题，第 4 章开头的本章概览</sub></td>
    <td align="center"><img src=".github/readme/reader-dark.png" alt="深色主题：第 6 章的代码示例切换为 Python" width="440"><br><sub>深色主题，第 6 章的代码示例切换为 Python 教学改写</sub></td>
  </tr>
</table>

| 位置 | 功能 |
| --- | --- |
| 顶栏 | 原例 / Python 切换，简体 / 繁体切换，阅读设置（字号、浅色或深色、原图是否用 SVG 显示），本章目录 |
| 左栏 | 全书搜索，章节列表，GitHub 仓库链接 |
| 右栏 | 本章目录，随滚动高亮当前小节 |
| 章首 | 本章概览，默认展开，可收起、放大、下载 SVG |
| 正文 | 译者图解内嵌显示；代码示例可逐段或全书切换为 Python；原书插图可在原图与 SVG 重绘之间切换；脚注点击往返 |
| 章末 | 本章回顾，上一章 / 下一章 |
| 简介页 | 显示上次读到的章节，一键继续阅读 |

## 目录

| 章节 | 内容概览 |
| --- | --- |
| [前言](docs/preface.md) | 我们学过语言、算法和工具，却很少专门学习如何设计软件。这本书关心的，正是怎样把复杂问题拆成可以独立理解和解决的部分。 |
| [第 1 章 介绍](docs/ch01.md) | 软件总在变化，设计也不能止于开工前的一张蓝图。贯穿每次迭代的任务，是不让复杂性随着功能一起失控地增长。 |
| [第 2 章 复杂性的本质](docs/ch02.md) | 复杂性常从小处显现：一处改动牵连许多地方，动手前要记住太多细节，甚至不知道自己遗漏了什么。依赖性与模糊性就这样慢慢积累。 |
| [第 3 章 能工作的代码是不够的](docs/ch03.md) | 只求代码尽快能跑，往往会把这些负担留给未来。作者主张换一种节奏：每次多花一点心思改善设计，为后续开发省下力气。 |
| [第 4 章 模块应该是深的](docs/ch04.md) | 这种投入首先体现在模块上。好的模块用简单的接口提供丰富的功能，让使用者不必深入内部，也能把事情做好。 |
| [第 5 章 信息隐藏和信息泄露](docs/ch05.md) | 要做到这一点，关键不是把代码分散到更多类里，而是把设计决策藏在恰当的地方，避免一次内部变化迫使其他模块跟着修改。 |
| [第 6 章 通用的模块是更深的](docs/ch06.md) | 当接口不再紧贴某个具体场景，而是提供少量通用操作时，模块往往能隐藏更多细节，许多特殊情况也随之消失。 |
| [第 7 章 不同的层级，不同的抽象](docs/ch07.md) | 模块组成层级后，每一层还应带来新的抽象。若只是把参数和调用原样转交，增加的层次可能只会让人多绕一圈。 |
| [第 8 章 下沉复杂性](docs/ch08.md) | 真正有用的封装，有时需要实现者多承担一些麻烦：在模块内部处理与自身功能相关的复杂性，换取众多调用者的简单。 |
| [第 9 章 在一起更好还是分开更好？](docs/ch09.md) | 由此，拆分还是合并就不能只凭代码长短决定。需要共享知识的代码可以放在一起，通用与专用的职责则应分清，最终看整个系统是否更容易理解。 |
| [第 10 章 通过定义来规避错误](docs/ch10.md) | 异常也要接受同样的审视。有些错误条件可以通过重新定义操作来消除；其余异常则可考虑屏蔽或集中处理，减少散落各处的特殊分支。 |
| [第 11 章 设计两次](docs/ch11.md) | 这些选择很难一次想对。与其急着实现第一个方案，不如先构思几种明显不同的设计，再比较哪一种接口更简单、依赖更少。 |
| [第 12 章 不写注释的四个借口](docs/ch12.md) | 但再好的结构，也无法让代码说出所有重要信息。书的目光因此转向注释：它不是设计失败后的补救，而是帮助读者理解抽象的一部分。 |
| [第 13 章 注释应该描述从代码中不易看出的信息](docs/ch13.md) | 有价值的注释不会逐句复述代码，而会补上代码没有说清的内容：边界在哪里，哪些规则必须遵守，以及为什么这样设计。 |
| [第 14 章 选取名称](docs/ch14.md) | 名称则是更短小的说明。一个准确、一致的名字，能让读者形成正确的预期，省去猜测，也减少由误解造成的缺陷。 |
| [第 15 章 先写注释](docs/ch15.md) | 文字还可以反过来检验设计。不妨先写清接口的用途与约定，若怎么都解释不明白，就有机会在编码之前发现抽象的问题。 |
| [第 16 章 修改现有的代码](docs/ch16.md) | 当软件进入持续维护阶段，这种设计意识仍不能放下。每次修改既要照顾当前需求，也要维护整体结构，让注释与实际行为一同更新。 |
| [第 17 章 一致性](docs/ch17.md) | 随着代码越来越多，一致的约定能让已有经验反复派上用场。相似的事物采用相似做法，不同的事物也应有清楚的区别。 |
| [第 18 章 代码应该是易理解的](docs/ch18.md) | 这些努力最终汇成同一种阅读体验：看到代码时，读者能较快地理解它，而不是四处寻找线索。设计应减少他们需要知道的事，并把必要的信息交代清楚。 |
| [第 19 章 软件发展趋势](docs/ch19.md) | 有了这把尺子，面对流行的方法也就不必盲从。继承、敏捷、测试和设计模式，都值得追问一句：它究竟是在降低复杂性，还是在增加负担？ |
| [第 20 章 性能设计](docs/ch20.md) | 性能同样不是放弃整洁设计的理由。先通过测量找到真正的瓶颈，再让关键路径少做不必要的工作，简单与高效往往可以兼得。 |
| [第 21 章 决定什么是重要的](docs/ch21.md) | 更深一层看，这些原则都在训练同一种判断：什么值得关注，什么可以隐藏。让重要的事情清楚可见，同时尽量减少必须操心的事情。 |
| [第 22 章 结论](docs/ch22.md) | 于是，全书回到最初的主张：好的设计来自持续的小额投入。把降低复杂性变成日常习惯，既能减轻未来的维护负担，也能让编程更有乐趣。 |
| [总结](docs/summary.md) | 最后，书中把设计原则与危险信号汇在一起。它们不是必须照办的戒律，而是留给下一次设计与代码审查的一组提醒。 |

## 仓库结构

```text
docs/                            简体正文，每章一个 Markdown 文件；docs/en/ 是公开的英文节选
docs/zh-tw/                      繁体正文，由 bin/zh-tw.py 从简体生成，请勿手改
docs/.vuepress/config.ts         站点配置
docs/.vuepress/reader/           阅读器：布局、图解与代码示例组件、图解和代码改写的元数据
docs/.vuepress/reader/chapters/  章首概览与章末回顾的内容数据，每章一个 JSON
docs/.vuepress/public/diagrams/  全部图解 SVG，桌面与手机版式，简体与繁体
docs/figures/                    原书插图
bin/                             生成脚本：繁体转换、章首章末图、术语表
tools/                           内容契约测试、静态校验、浏览器验收脚本
review/                          翻译审校记录、术语数据、阅读器验收结论
.github/workflows/CI.yml         每次推送运行全部检查并构建；main 分支构建后部署到 GitHub Pages
```

## 翻译是怎么审校的

润色以准确为先。先从简体译文和英文原文抽取术语候选并统计共现，由人工逐项裁定译法、义项和使用边界；再对照第二版 EPUB 逐段核对前言、22 章正文与总结，修订生硬句式，同时检查条件、否定、因果和适用范围有没有走样；最后与原始快照比对，确认英文节选、代码、标识符、链接和图片一字未动。原书本身的疑点保留原文，以译者注说明勘误依据。

想复核任何一处改动，可以从这几个文件进入：

- [术语表](review/translation/glossary.md)：81 条核心术语的首选译法、义项和使用边界。
- [审校方法与统计](review/translation/README.md)：候选抽取、配对和裁定的完整规则。
- [全书审阅发现](review/book-v16/findings.md)：按新流程重新审阅全书时记录的问题与修订。
- [阅读器验收](review/reader/README.md)：图解、原图重绘、Python 改写的审阅与验证记录。
- [Python 改写审查](review/reader/python-review.md)：每段改写与原例的对应关系和表达限制。

## 参与改进

发现译文可以更好，欢迎直接提 Pull Request。

1. 修改 `docs/` 下对应章节的简体正文。繁体版由脚本生成，请勿手改。
2. 涉及术语时先查[术语表](review/translation/glossary.md)，与已裁定的译法保持一致。
3. 修改 Python 对照：编辑 `docs/.vuepress/reader/examples/` 中对应章节的 JSON。构建时会校验原例与正文一致、Python 能通过语法解析。
4. 修改章首概览或章末回顾：编辑 `docs/.vuepress/reader/chapters/chNN.json`，运行 `python3 bin/chapter_figures.py` 重新生成。文字超出版式预算时脚本会报错。
5. 提交前运行下面的检查，CI 会做同样的事：

```bash
npm ci
npm test
uv run --with opencc==1.4.1 python3 bin/zh-tw.py            # 重新生成繁体正文
uv run --with opencc==1.4.1 python3 tools/localize.py       # 重新生成繁体图解与元数据
uv run --with opencc==1.4.1 python3 bin/chapter_figures.py --check
python3 bin/glossary.py --check
python3 tools/verify.py --complete
npm run build
```

## 来源与许可

- 中文译文源自 [yingang/aposd2e-zh](https://github.com/yingang/aposd2e-zh) 的社区译稿，感谢原译者与所有贡献者。本仓库在此基础上对照原文修订全书，并新增了阅读器、图解、Python 对照和审校工具。
- 原书版权归 John Ousterhout 所有。本仓库的译文与补充材料以 [CC BY 4.0](./LICENSE) 许可发布。
- 发现翻译问题或有改进建议，欢迎提交 [Issue](https://github.com/DayuanJiang/aposd2e-zh/issues) 或 Pull Request。

## Star History

<a href="https://www.star-history.com/#DayuanJiang/aposd2e-zh&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=DayuanJiang/aposd2e-zh&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=DayuanJiang/aposd2e-zh&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=DayuanJiang/aposd2e-zh&type=Date" />
 </picture>
</a>
