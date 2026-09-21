import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import MarkdownIt from 'markdown-it'

export const sourceHash = (code) => createHash('sha256').update(code).digest('hex')
export function displayedSourceMatches(displayed, original, traditional = false) {
  if (typeof original !== 'string') return false
  // The existing traditional generator removes trailing whitespace on each line.
  return displayed === original || (traditional && displayed === original.replace(/[ \t]+$/gm, ''))
}
const markdown = new MarkdownIt({ html: true })
const sourceLanguages = new Map([
  ['java', 'java'], ['c', 'c'], ['cpp', 'cpp'], ['c++', 'cpp'], ['cxx', 'cpp'],
  ['go', 'go'], ['golang', 'go'],
])
const unchangedLanguages = new Set(['', 'python', 'text', 'plaintext', 'txt'])

export function adaptationLanguage(info) {
  const label = info.trim().split(/\s+/)[0].toLowerCase()
  if (unchangedLanguages.has(label)) return null
  const language = sourceLanguages.get(label)
  if (!language) throw new Error(`Unreviewed code-fence language: ${label}`)
  return language
}

export function readCollection(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort()
    .flatMap((name) => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')))
}

export function collectBook(docs) {
  const names = ['README.md', 'preface.md',
    ...Array.from({ length: 22 }, (_, i) => `ch${String(i + 1).padStart(2, '0')}.md`),
    'summary.md']
  const book = {}
  const examples = []
  const sections = new Map()
  for (const locale of ['', 'zh-tw', 'en']) {
    book[locale] = names.map((name) => {
      const file = path.join(docs, locale, name)
      const content = fs.readFileSync(file, 'utf8')
      const tokens = markdown.parse(content, {})
      sections.set(path.posix.join(locale, name), new Set(tokens.flatMap((token, index) =>
        token.type === 'heading_open' && token.level === 0
          ? [tokens[index + 1]?.content.match(/^(\d+(?:\.\d+)+)\s/)?.[1]].filter(Boolean) : [])))
      const titleIndex = tokens.findIndex((token) => token.type === 'heading_open')
      const title = tokens[titleIndex + 1]?.content || name
      const id = name.replace('.md', '')
      let ordinal = 0
      const prose = []
      for (const token of tokens) {
        if (token.type === 'inline') {
          prose.push((token.children || []).filter((child) =>
            child.type === 'text' || child.type === 'code_inline')
            .map((child) => child.content).join(''))
        }
        if (token.type === 'fence') {
          ordinal += 1
          const language = !locale ? adaptationLanguage(token.info) : null
          if (language) {
            examples.push({ id: `${id}-f${ordinal}`, chapter: id,
              sourceHash: sourceHash(token.content), source: token.content,
              line: token.map[0] + 1, language })
          }
        }
      }
      return { id, title, path: `${locale ? `/${locale}` : ''}/${id === 'README' ? '' : `${id}.html`}`,
        text: prose.join('\n') }
    })
  }
  return { book, examples, sections }
}

export function validateExamples(inventory, adaptations, requireComplete = false) {
  const source = new Map(inventory.map((entry) => [entry.id, entry]))
  const result = new Map()
  for (const entry of adaptations) {
    if (result.has(entry.id)) throw new Error(`Duplicate adaptation: ${entry.id}`)
    const original = source.get(entry.id)
    if (!original || original.sourceHash !== entry.sourceHash) {
      throw new Error(`Python adaptation no longer matches its source: ${entry.id}`)
    }
    if (!entry.python?.trim() || !entry.note || !entry.noteEn) {
      throw new Error(`Incomplete adaptation: ${entry.id}`)
    }
    result.set(entry.id, entry)
  }
  if (requireComplete && result.size !== source.size) {
    throw new Error(`Missing Python adaptations: ${[...source.keys()].filter((id) => !result.has(id)).join(', ')}`)
  }
  return result
}

export function diagramInsertions(tokens, diagrams, chapter) {
  const headings = tokens.flatMap((token, index) => {
    if (token.type !== 'heading_open') return []
    const section = tokens[index + 1]?.content.match(/^(\d+(?:\.\d+)+)\s/)?.[1]
    return [{ index, level: Number(token.tag.slice(1)), section }]
  })
  let paragraphs = 0
  const introCount = ['ch01', 'ch03', 'ch15'].includes(chapter) ? 2 : 1
  const introIndex = tokens.findIndex((token) => {
    if (token.type === 'paragraph_close' && token.level === 0) paragraphs += 1
    return paragraphs === introCount
  }) + 1
  return diagrams.map((diagram) => {
    if (diagram.anchor?.afterFence) {
      let ordinal = 0
      const index = tokens.findIndex((token) => {
        if (token.type !== 'fence') return false
        ordinal += 1
        return `${chapter}-f${ordinal}` === diagram.anchor.afterFence && token.level === 0
      })
      if (index < 0) throw new Error(`Missing root code fence anchor for ${diagram.id}`)
      return { index: index + 1, id: diagram.id }
    }
    if (diagram.anchor?.intro) return { index: introIndex, id: diagram.id }
    if (diagram.anchor?.end) return { index: tokens.length, id: diagram.id }
    const intro = diagram.anchor?.section === 'intro'
    const heading = intro ? { index: -1, level: 1 } : headings.find((item) => item.section === diagram.anchor?.section)
    if (!heading) throw new Error(`Missing section anchor for ${diagram.id}`)
    const next = headings.find((item) => item.index > heading.index &&
      (intro ? item.level === 2 : item.level <= heading.level))
    const end = next?.index ?? tokens.length
    if (diagram.anchor?.paragraph !== undefined) {
      const ordinal = diagram.anchor.paragraph
      if (!Number.isInteger(ordinal) || ordinal < 1) throw new Error(`Invalid paragraph anchor for ${diagram.id}`)
      const candidates = tokens.flatMap((token, index) =>
        index > heading.index && index < end && token.type === 'paragraph_close' && token.level === 0 ? [index + 1] : [])
      if (candidates.length < ordinal) throw new Error(`Missing paragraph anchor for ${diagram.id}`)
      return { index: candidates[ordinal - 1], id: diagram.id }
    }
    return { index: end, id: diagram.id }
  })
}
