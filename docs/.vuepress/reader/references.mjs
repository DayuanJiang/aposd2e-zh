const sectionNumber = (title) => title.match(/^(\d+(?:\.\d+)+)\s/)?.[1]
export const sectionAnchor = (number) => `section-${number.replaceAll('.', '-')}`

// Retain bookmarks to the heading whose book title was corrected.
const legacyHeadings = {
  'ch09.md': { '9.8': '_9-8-不同的观点-整洁的代码' },
  'zh-tw/ch09.md': { '9.8': '_9-8-不同的觀點-整潔的程式碼' },
}

const inlineHtml = (state, content) => {
  const token = new state.Token('html_inline', '', 0)
  token.content = content
  return token
}
const textToken = (state, content) => {
  const token = new state.Token('text', '', 0)
  token.content = content
  return token
}

function addSectionAnchors(state, relative) {
  for (let index = 0; index < state.tokens.length; index += 1) {
    const token = state.tokens[index]
    if (token.type !== 'heading_open' || token.level !== 0) continue
    const inline = state.tokens[index + 1]
    const number = sectionNumber(inline?.content || '')
    if (!number) continue
    const ids = [sectionAnchor(number), legacyHeadings[relative]?.[number]].filter(Boolean)
    const anchors = ids.filter((id) => id !== token.attrGet('id')).map((id) =>
      inlineHtml(state, `<span id="${state.md.utils.escapeHtml(id)}" class="reader-section-anchor" aria-hidden="true"></span>`))
    inline.children.unshift(...anchors)
  }
}

function resolveSectionLinks(state, relative, sections) {
  for (const token of state.tokens) {
    if (token.type !== 'inline') continue
    const children = token.children || []
    children.forEach((child, index) => {
      if (child.type !== 'link_open') return
      const href = child.attrGet('href')
      if (!href || href.includes('#')) return
      const end = children.findIndex((entry, i) => i > index && entry.type === 'link_close')
      if (end < 0) return
      const label = children.slice(index + 1, end).filter((entry) =>
        ['text', 'code_inline'].includes(entry.type)).map((entry) => entry.content).join('').trim()
      const match = label.match(/^(?:第\s*(\d+(?:\.\d+)+)\s*[节節]|Section\s+(\d+(?:\.\d+)+))$/i)
      if (!match) return
      let url
      try { url = new URL(href, `https://book.invalid/${relative}`) } catch { return }
      if (url.origin !== 'https://book.invalid') return
      let target
      try { target = decodeURIComponent(url.pathname) } catch { return }
      if (target.endsWith('.html') && state.env.base && target.startsWith(state.env.base)) {
        target = target.slice(state.env.base.length)
      }
      target = target.replace(/^\//, '').replace(/\.html$/, '.md')
      const number = match[1] || match[2]
      if (!sections.get(target)?.has(number)) return
      child.attrSet('href', `${href}#${sectionAnchor(number)}`)
      ;(state.env.readerSectionLinks ??= []).push({ target, number })
    })
  }
}

function addFootnotes(state, relative) {
  const definitions = new Map()
  const ambiguous = new Set()
  const definitionTokens = new Set()
  state.tokens.forEach((token, index) => {
    const paragraph = state.tokens[index - 1]
    if (token.type !== 'inline' || paragraph?.type !== 'paragraph_open' || paragraph.level !== 0) return
    const first = token.children?.[0]
    const marker = first?.type === 'text' && first.content.match(/^\[(\d+)\]\s+/)
    const number = marker && token.content.slice(marker[0].length).trim() ? marker[1] : null
    if (!number) return
    definitionTokens.add(token)
    if (definitions.has(number)) ambiguous.add(number)
    definitions.set(number, { paragraph, token, references: [] })
  })
  for (const number of ambiguous) definitions.delete(number)
  const page = relative.replace(/\.md$/, '').replace(/[^A-Za-z0-9-]/g, '-')
  const noteId = (number) => `reader-note-${page}-${number}`
  const english = relative.startsWith('en/')
  const traditional = relative.startsWith('zh-tw/')
  const noteLabel = (number) => english ? `Note ${number}` : `${traditional ? '註釋' : '注释'} ${number}`
  for (let index = 0; index < state.tokens.length; index += 1) {
    const token = state.tokens[index]
    if (token.type !== 'inline' || definitionTokens.has(token) ||
        state.tokens[index - 1]?.type !== 'paragraph_open' ||
        token.children?.some((child) => child.type === 'html_inline')) continue
    let inLink = false
    token.children = (token.children || []).flatMap((child) => {
      if (child.type === 'link_open') inLink = true
      if (child.type === 'link_close') inLink = false
      if (child.type !== 'text' || inLink) return [child]
      const parts = []
      let offset = 0
      for (const match of child.content.matchAll(/\[(\d+)\]/g)) {
        const definition = definitions.get(match[1])
        // Do not turn bare array-index-like expressions into note references.
        if (!definition || /[A-Za-z0-9_\]]/.test(child.content[match.index - 1] || '')) continue
        const id = `${noteId(match[1])}-ref-${definition.references.length + 1}`
        definition.references.push(id)
        if (match.index > offset) parts.push(textToken(state, child.content.slice(offset, match.index)))
        parts.push(inlineHtml(state,
          `<sup class="reader-footnote-reference"><a id="${id}" href="#${noteId(match[1])}" data-reader-footnote="reference" aria-label="${noteLabel(match[1])}">${match[0]}</a></sup>`))
        offset = match.index + match[0].length
      }
      if (!parts.length) return [child]
      if (offset < child.content.length) parts.push(textToken(state, child.content.slice(offset)))
      return parts
    })
  }
  let first = true
  for (const [number, definition] of definitions) {
    if (!definition.references.length) continue
    definition.paragraph.attrSet('id', noteId(number))
    definition.paragraph.attrSet('tabindex', '-1')
    definition.paragraph.attrJoin('class', `reader-footnote${first ? ' reader-footnote-first' : ''}`)
    first = false
    const links = definition.references.map((id, index) => {
      const label = english ? `Back to note ${number}, reference ${index + 1}`
        : `${traditional ? '返回註釋' : '返回注释'} ${number} 的第 ${index + 1} ${traditional ? '處引用' : '处引用'}`
      return `<a href="#${id}" class="reader-footnote-backref" data-reader-footnote="back" aria-label="${label}" title="${label}">↩${index ? index + 1 : ''}</a>`
    }).join(' ')
    definition.token.children.push(inlineHtml(state, ` <span class="reader-footnote-backlinks">${links}</span>`))
  }
}

export function enhanceBookReferences(state, sections) {
  const relative = (state.env.filePathRelative || '').replaceAll('\\', '/')
  if (!relative.endsWith('.md')) return
  resolveSectionLinks(state, relative, sections)
  addFootnotes(state, relative)
  addSectionAnchors(state, relative)
}
