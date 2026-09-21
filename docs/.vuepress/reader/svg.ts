export function parseSvg(source: string) {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (document.querySelector('parsererror')) throw new Error('Invalid diagram')
  return document.documentElement
}

export function scopedSvg(source: string, prefix: string) {
  const root = parseSvg(source)
  const ids = new Map<string, string>()
  for (const node of [root, ...root.querySelectorAll('[id]')]) {
    if (node.id) ids.set(node.id, `${prefix}-${node.id}`)
  }
  for (const node of [root, ...root.querySelectorAll('*')]) {
    for (const attr of [...node.attributes]) {
      let value = attr.value
      if (attr.name === 'id') value = ids.get(value) || value
      else if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') value = value.split(/\s+/).map((id) => ids.get(id) || id).join(' ')
      else value = value.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${ids.get(id) || id})`)
      if ((attr.name === 'href' || attr.name === 'xlink:href') && value.startsWith('#')) value = `#${ids.get(value.slice(1)) || value.slice(1)}`
      node.setAttribute(attr.name, value)
    }
  }
  root.setAttribute('class', 'chapter-svg')
  return new XMLSerializer().serializeToString(root)
}
