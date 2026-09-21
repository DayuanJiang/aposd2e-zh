import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import MarkdownIt from 'markdown-it'
import { adaptationLanguage, collectBook, diagramInsertions, displayedSourceMatches, readCollection, validateExamples } from '../../docs/.vuepress/reader/content.mjs'

const md = new MarkdownIt()
test('section-end placement stops at the next peer heading, not a child heading', () => {
  const tokens = md.parse('# Book\n\nIntro.\n\n## 2.1 First\n\nBody.\n\n### Child\n\nMore.\n\n## 2.2 Next\n\nEnd.', {})
  const next = tokens.findIndex((token, index) => token.type === 'heading_open' && tokens[index + 1].content === '2.2 Next')
  assert.deepEqual(diagramInsertions(tokens, [{ id: 'one', anchor: { section: '2.1' } }], 'ch02'), [{ id: 'one', index: next }])
})
test('intro, final section and chapter-end anchors work without changing source tokens', () => {
  const tokens = md.parse('# Book\n\nIntro.\n\n## 2.1 First\n\nBody.', {})
  const before = JSON.stringify(tokens)
  assert.deepEqual(diagramInsertions(tokens, [
    { id: 'intro', anchor: { intro: true } },
    { id: 'section', anchor: { section: '2.1' } },
    { id: 'end', anchor: { end: true } },
  ], 'ch02').map((entry) => entry.index), [6, tokens.length, tokens.length])
  assert.equal(JSON.stringify(tokens), before)
  assert.throws(() => diagramInsertions(tokens, [{ id: 'missing', anchor: { section: '9.9' } }], 'ch02'), /Missing section/)
})
test('paragraph anchors are section-scoped and ignore quoted translator notes', () => {
  const tokens = md.parse('# Book\n\nSubtitle.\n\nIntro.\n\n## 2.1 First\n\nOne.\n\n> Note.\n\nTwo.\n\n## 2.2 Next\n\nThree.', {})
  const intro = diagramInsertions(tokens, [{ id: 'intro', anchor: { section: 'intro', paragraph: 2 } }], 'ch02')[0]
  assert.equal(tokens[intro.index - 2].content, 'Intro.')
  const body = diagramInsertions(tokens, [{ id: 'body', anchor: { section: '2.1', paragraph: 2 } }], 'ch02')[0]
  assert.equal(tokens[body.index - 2].content, 'Two.')
  assert.throws(() => diagramInsertions(tokens, [{ id: 'missing', anchor: { section: '2.1', paragraph: 3 } }], 'ch02'), /Missing paragraph/)
})
test('code anchors use book-wide fence ordinals and require a root-level fence', () => {
  const tokens = md.parse('# Book\n\n```text\nfirst\n```\n\n> ```java\n> quoted\n> ```\n\n```java\nthird\n```\n\nAfter.', {})
  const result = diagramInsertions(tokens, [{ id: 'after', anchor: { afterFence: 'ch18-f3' } }], 'ch18')[0]
  assert.equal(tokens[result.index - 1].content, 'third\n')
  assert.throws(() => diagramInsertions(tokens, [{ id: 'quoted', anchor: { afterFence: 'ch18-f2' } }], 'ch18'), /Missing root code fence/)
  assert.throws(() => diagramInsertions(tokens, [{ id: 'wrong', anchor: { afterFence: 'ch17-f3' } }], 'ch18'), /Missing root code fence/)
})
test('source languages are explicit; new languages cannot silently bypass adaptation', () => {
  for (const [input, expected] of [
    ['java', 'java'], ['c', 'c'], ['cpp', 'cpp'], ['C++', 'cpp'],
    ['cxx', 'cpp'], ['go', 'go'], ['golang', 'go'], ['cpp title="example"', 'cpp'],
    ['python', null], ['', null], ['text', null],
  ]) assert.equal(adaptationLanguage(input), expected)
  assert.throws(() => adaptationLanguage('rust'), /Unreviewed code-fence language/)
})
test('traditional display allows only the generator trailing-whitespace normalization', () => {
  const original = 'if (header == NULL) \n    goto packetTooShort;\n   \n'
  const normalized = 'if (header == NULL)\n    goto packetTooShort;\n\n'
  assert.ok(displayedSourceMatches(original, original))
  assert.ok(displayedSourceMatches(normalized, original, true))
  assert.ok(!displayedSourceMatches(normalized, original))
  assert.ok(!displayedSourceMatches(normalized.replace('NULL', 'other'), original, true))
  assert.ok(!displayedSourceMatches(normalized.replace('    goto', 'goto'), original, true))
  assert.ok(!displayedSourceMatches(normalized, undefined, true))
})
test('all 60 source-locked Java, C, C++ and Go variants remain complete', () => {
  const { book, examples } = collectBook(path.resolve('docs'))
  assert.equal(examples.length, 60)
  assert.deepEqual(examples.reduce((counts, entry) => {
    counts[entry.language] = (counts[entry.language] || 0) + 1
    return counts
  }, {}), { c: 2, java: 44, cpp: 12, go: 2 })
  assert.equal(examples.find((entry) => entry.id === 'ch18-f3').language, 'cpp')
  for (const chapters of Object.values(book)) assert.equal(chapters.length, 25)
  assert.equal(book[''][0].path, '/')
  assert.equal(book['zh-tw'][0].path, '/zh-tw/')
  assert.equal(book.en[0].path, '/en/')
  const variants = readCollection('docs/.vuepress/reader/examples')
  assert.equal(validateExamples(examples, variants, true).size, examples.length)
  assert.throws(() => validateExamples(examples, variants.slice(1), true), /Missing Python/)
  assert.throws(() => validateExamples(examples, [{ ...variants[0], sourceHash: 'changed' }]), /no longer matches/)
})
test('every active diagram has a valid simplified and traditional section anchor', () => {
  for (const diagram of readCollection('docs/.vuepress/reader/diagrams')) {
    for (const locale of ['', 'zh-tw']) {
      const source = readFileSync(path.join('docs', locale, `${diagram.chapter}.md`), 'utf8')
      diagramInsertions(md.parse(source, {}), [{ ...diagram, id: diagram.id || diagram.chapter, anchor: diagram.anchor || { intro: true } }], diagram.chapter)
    }
  }
})
