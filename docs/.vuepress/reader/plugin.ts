import path from 'node:path'
import { collectBook, diagramInsertions, displayedSourceMatches, readCollection, validateExamples } from './content.mjs'
import { enhanceBookReferences } from './references.mjs'

export function readerPlugin() {
  return (app) => {
    const directory = path.resolve('docs/.vuepress/reader')
    const { book, examples, sections } = collectBook(path.resolve('docs'))
    const sourceExamples = new Map(examples.map((entry) => [entry.id, entry.source]))
    const adaptations = validateExamples(examples, readCollection(path.join(directory, 'examples')), true)
    const diagramList = readCollection(path.join(directory, 'diagrams')).map((entry) => ({
      ...entry, id: entry.id || entry.chapter, anchor: entry.anchor || { intro: true },
    }))
    const diagrams = Object.fromEntries(diagramList.map((entry) => [entry.id, entry]))
    if (Object.keys(diagrams).length !== diagramList.length) throw new Error('Duplicate diagram IDs')
    const figureList = readCollection(path.join(directory, 'figures'))
    const figures = Object.fromEntries(figureList.map((entry) => [entry.id, entry]))
    const figuresByFile = new Map(figureList.map((entry) => [entry.original, entry]))
    return {
      name: 'aposd-reader',
      extendsPage(page) {
        const relative = page.filePathRelative || ''
        const chapter = relative.match(/(?:^|\/)(ch\d{2})\.md$/)?.[1]
        page.data.reader = { chapter, locale: relative.startsWith('zh-tw/') ? 'zh-tw' : relative.startsWith('en/') ? 'en' : '' }
      },
      extendsMarkdown(md) {
        md.core.ruler.push('aposd-supplements', (state) => {
          const relative = state.env.filePathRelative || ''
          enhanceBookReferences(state, sections)
          const chapter = relative.match(/(?:^|\/)(ch\d{2})\.md$/)?.[1]
          if (!chapter) return
          let ordinal = 0
          state.tokens.forEach((token) => {
            if (token.type === 'fence') {
              ordinal += 1
              token.meta = { ...token.meta, readerExample: `${chapter}-f${ordinal}` }
            }
          })
          if (!relative.startsWith('en/')) {
            const entries = diagramList.filter((entry) => entry.chapter === chapter)
            // Reverse splicing keeps original token offsets and same-anchor metadata order.
            const insertions = diagramInsertions(state.tokens, entries, chapter)
            for (const { index, id } of insertions.reverse().sort((a, b) => b.index - a.index)) {
              const token = new state.Token('html_block', '', 0)
              token.content = `<ChapterDiagram chapter="${chapter}" diagram-id="${id}" />\n`
              token.block = true
              state.tokens.splice(index, 0, token)
            }
          }
        })
        const renderImage = md.renderer.rules.image
        md.renderer.rules.image = (tokens, index, options, env, renderer) => {
          const token = tokens[index]
          const filename = path.basename(token.attrGet('src') || '')
          const figure = figuresByFile.get(filename)
          const original = renderImage(tokens, index, options, env, renderer)
          if (!figure) return original
          return `<OriginalFigure figure-id="${figure.id}">${original}</OriginalFigure>`
        }
        const renderFence = md.renderer.rules.fence.bind(md.renderer.rules)
        md.renderer.rules.fence = (tokens, index, options, env, renderer) => {
          const token = tokens[index]
          const entry = adaptations.get(token.meta?.readerExample)
          const original = renderFence(tokens, index, options, env, renderer)
          if (!entry) return original
          if (!displayedSourceMatches(token.content, sourceExamples.get(entry.id),
            env.filePathRelative?.startsWith('zh-tw/'))) {
            throw new Error(`Mismatched displayed example: ${entry.id}`)
          }
          const alternate = Object.assign(Object.create(Object.getPrototypeOf(token)), token, {
            info: 'python', content: entry.python,
          })
          const python = renderFence([alternate], 0, options, env, renderer)
          const attr = md.utils.escapeHtml
          return `<CodeExample example-id="${entry.id}" note="${attr(entry.note)}" note-en="${attr(entry.noteEn)}" note-tw="${attr(entry.noteTw || entry.note)}" original-language="${attr(entry.originalLanguage)}"><template #original>${original}</template><template #python>${python}</template></CodeExample>\n`
        }
      },
      async onPrepared() {
        const slim = Object.fromEntries(Object.entries(book).map(([locale, chapters]) =>
          [locale, chapters.map(({ text, ...entry }) => entry)]))
        const viewFields = (collection, fields) => Object.fromEntries(
          Object.entries(collection).map(([id, entry]) => [id, Object.fromEntries(
            fields.filter((field) => entry[field] !== undefined).map((field) => [field, entry[field]]),
          )]),
        )
        await app.writeTemp('reader/book.js', `export default ${JSON.stringify(slim)}`)
        for (const [locale, chapters] of Object.entries(book)) {
          await app.writeTemp(`reader/search-${locale || 'zh'}.js`, `export default ${JSON.stringify(chapters)}`)
        }
        const diagramViews = viewFields(diagrams, [
          'kind', 'title', 'summary', 'alt', 'desktop', 'mobile',
          'titleTw', 'summaryTw', 'altTw', 'desktopTw', 'mobileTw',
        ])
        await app.writeTemp('reader/diagrams.js', `export default ${JSON.stringify(diagramViews)}`)
        await app.writeTemp('reader/figures.js', `export default ${JSON.stringify(viewFields(figures, ['vector', 'alt', 'kind', 'width', 'height']))}`)
      },
    }
  }
}
