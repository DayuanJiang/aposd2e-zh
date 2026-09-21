import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { createMarkdown } from '@vuepress/markdown'
import { collectBook, diagramInsertions, readCollection } from '../../docs/.vuepress/reader/content.mjs'
import { enhanceBookReferences, sectionAnchor } from '../../docs/.vuepress/reader/references.mjs'

function markdown(sections = new Map()) {
  const md = createMarkdown({ links: { internalTag: 'a' }, linkify: true })
  md.core.ruler.push('references-under-test', (state) => enhanceBookReferences(state, sections))
  return md
}
const environment = (filePathRelative = 'ch04.md') => ({ filePathRelative, base: '/aposd2e-zh/' })

test('legacy notes keep text and provide unique forward and return targets', () => {
  const html = markdown().render('First [1]. Again [1].\n\n[1] **Original** note with `code`.\n', environment())
  assert.equal((html.match(/data-reader-footnote="reference"/g) || []).length, 2)
  assert.match(html, /id="reader-note-ch04-1"/)
  for (const index of [1, 2]) {
    assert.match(html, new RegExp(`id="reader-note-ch04-1-ref-${index}"`))
    assert.match(html, new RegExp(`href="#reader-note-ch04-1-ref-${index}"`))
  }
  assert.match(html, /<strong>Original<\/strong> note with <code\b[^>]*>code<\/code>/)
  assert.match(html, /tabindex="-1"/)
})

test('notes with automatic URL links and traditional labels are supported', () => {
  const html = markdown().render('Reference [1].\n\n[1] https://example.test\n', environment('zh-tw/ch14.md'))
  assert.match(html, /id="reader-note-zh-tw-ch14-1"/)
  assert.match(html, /aria-label="註釋 1"/)
  assert.match(html, /https:\/\/example.test/)
  assert.match(html, /返回註釋 1 的第 1 處引用/)
})

test('missing, unused and ambiguous definitions are not invented or removed', () => {
  const missing = markdown().render('Missing [2].\n\n[1] Unused definition.', environment())
  assert.doesNotMatch(missing, /data-reader-footnote/)
  assert.match(missing, /Missing \[2\]/)
  assert.match(missing, /\[1\] Unused definition/)
  const ambiguous = markdown().render('Reference [1].\n\n[1] First.\n\n[1] Second.', environment())
  assert.doesNotMatch(ambiguous, /data-reader-footnote/)
})

test('code, image labels, HTML and existing links are not treated as notes', () => {
  const html = markdown().render([
    '`value [1]` and value[1].',
    '[existing [1]](https://example.test)',
    '![image [1]](image.png)',
    'Raw <code>[1]</code>.',
    '```text\n[1]\n```',
    '[1] Definition.',
  ].join('\n\n'), environment())
  assert.doesNotMatch(html, /data-reader-footnote/)
  assert.match(html, /<code>\[1\]<\/code>/)
})

test('section aliases retain the original generated heading ID', () => {
  const html = markdown().render('## 6.3 更通用的 API\n', environment('ch06.md'))
  assert.match(html, /id="_6-3-更通用的-api"/)
  assert.match(html, /id="section-6-3"/)
  assert.match(html, /href="#_6-3-更通用的-api"/)
  const legacy = markdown().render('## 9.8 不同的观点：《代码整洁之道》', environment('ch09.md'))
  assert.match(legacy, /id="_9-8-不同的观点-整洁的代码"/)
  assert.match(legacy, /id="_9-8-不同的观点-《代码整洁之道》"/)
})

test('only known internal subsection references gain a stable fragment', () => {
  const sections = new Map([
    ['ch06.md', new Set(['6.3'])],
    ['zh-tw/ch06.md', new Set(['6.3'])],
  ])
  const html = markdown(sections).render([
    '[第 6.3 节](ch06.md?mode=reading)',
    '[Section 6.3](ch06.html)',
    '[第 6.3 节](/aposd2e-zh/ch06.html)',
    '[第 6.3 节](ch06.md#already-chosen)',
    '[第 6 章](ch06.md)',
    '[第 6.9 节](ch06.md)',
    '[第 6.3 节](https://external.test/ch06.md)',
  ].join('\n\n'), environment('ch08.md'))
  assert.match(html, /ch06\.html\?mode=reading#section-6-3/)
  assert.equal((html.match(/#section-6-3/g) || []).length, 3)
  assert.match(html, /ch06\.html#already-chosen/)
  assert.match(html, /https:\/\/external\.test\/ch06\.md/)
  const tw = markdown(sections).render('[第 6.3 節](ch06.md)', environment('zh-tw/ch08.md'))
  assert.match(tw, /\/zh-tw\/ch06\.html#section-6-3/)
})

test('enhancement does not move paragraph or code anchors for diagrams', () => {
  const source = '# Book\n\nIntro [1].\n\n## 4.1 Section\n\nBody.\n\n```java\ncode();\n```\n\n[1] Note.\n'
  const raw = createMarkdown().parse(source, environment())
  const enhanced = markdown().parse(source, environment())
  const diagrams = [{ id: 'one', anchor: { section: '4.1', paragraph: 1 } },
    { id: 'two', anchor: { afterFence: 'ch04-f1' } }]
  assert.deepEqual(diagramInsertions(enhanced, diagrams, 'ch04'), diagramInsertions(raw, diagrams, 'ch04'))
  assert.deepEqual(enhanced.filter((token) => token.type === 'fence').map((token) => token.content), ['code();\n'])
})

test('all real book subsection links resolve and all six legacy notes work in both Chinese locales', (t) => {
  const { sections } = collectBook(path.resolve('docs'))
  const render = markdown(sections)
  const rendered = new Map()
  const linked = []
  let notes = 0
  for (const file of sections.keys()) {
    const env = environment(file)
    const html = render.render(readFileSync(path.join('docs', file), 'utf8'), env)
    rendered.set(file, html)
    linked.push(...(env.readerSectionLinks || []))
    notes += (html.match(/data-reader-footnote="reference"/g) || []).length
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1])
    assert.equal(new Set(ids).size, ids.length, `Duplicate ID in ${file}`)
    for (const diagram of readCollection('docs/.vuepress/reader/diagrams').filter((entry) =>
      file === `${entry.chapter}.md` || file === `zh-tw/${entry.chapter}.md`)) {
      diagramInsertions(render.parse(readFileSync(path.join('docs', file), 'utf8'), environment(file)), [diagram], diagram.chapter)
    }
  }
  for (const { target, number } of linked) assert.ok(rendered.get(target).includes(`id="${sectionAnchor(number)}"`), `${target}:${number}`)
  assert.equal(notes, 12)
  assert.ok(linked.length > 20)
  t.diagnostic(`${linked.length} subsection references and ${notes} footnote references checked.`)
})
