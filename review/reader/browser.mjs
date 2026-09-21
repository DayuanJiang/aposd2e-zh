import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'
import MarkdownIt from 'markdown-it'
import { readCollection, sourceHash } from '../../docs/.vuepress/reader/content.mjs'

const base = process.env.READER_URL || 'http://127.0.0.1:8084/aposd2e-zh'
const output = process.argv.find((arg) => arg.startsWith('--output='))?.slice(9) || process.env.READER_SHOTS || '/tmp/aposd2e-reader-qa'
const gallery = process.argv.includes('--gallery')
const originalsOnly = process.argv.includes('--originals')
const codeMode = process.argv.includes('--python') ? 'python' : 'original'
const chapterFilter = process.argv.find((arg) => arg.startsWith('--chapters='))?.slice(11).split(',')
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const diagrams = readCollection('docs/.vuepress/reader/diagrams')
const exampleIds = new Set(readCollection('docs/.vuepress/reader/examples').map((item) => item.id))
const figureFiles = new Map(readCollection('docs/.vuepress/reader/figures').map((item) => [item.original, item.id]))
const markdown = new MarkdownIt()
fs.mkdirSync(output, { recursive: true })
const failures = []
const evidence = []
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')

async function geometry(page) {
  return page.evaluate(() => [...document.querySelectorAll('.asset')].map((asset) => {
    const root = asset.querySelector('svg')
    const box = root.viewBox.baseVal
    const bounds = root.getBoundingClientRect()
    const measured = (node) => {
      const b = node.getBoundingClientRect()
      return { x: box.x + (b.left - bounds.left) * box.width / bounds.width,
        y: box.y + (b.top - bounds.top) * box.height / bounds.height,
        w: b.width * box.width / bounds.width, h: b.height * box.height / bounds.height }
    }
    const nodes = [...root.querySelectorAll('text')].map((node) => {
      return { text: node.textContent, ...measured(node) }
    }).filter((node) => node.w && node.h)
    const rectangles = [...root.querySelectorAll('rect')].map(measured)
      .filter((rect) => rect.w > 20 && rect.h > 20).sort((a, b) => a.w * a.h - b.w * b.h)
    const containerCandidates = nodes.flatMap((node) => {
      const cx = node.x + node.w / 2
      const cy = node.y + node.h / 2
      const container = rectangles.find((rect) => cx >= rect.x && cx <= rect.x + rect.w &&
        cy >= rect.y && cy <= rect.y + rect.h)
      if (!container) return []
      return node.x < container.x - 1 || node.y < container.y - 1 ||
        node.x + node.w > container.x + container.w + 1 || node.y + node.h > container.y + container.h + 1
        ? [{ text: node.text, node, container }] : []
    })
    const outside = nodes.filter((node) => node.x < box.x - 1 || node.y < box.y - 1 ||
      node.x + node.w > box.x + box.width + 1 || node.y + node.h > box.y + box.height + 1)
    const overlaps = []
    nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => {
      const x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (x > 2 && y > 2) overlaps.push({ a: a.text, b: b.text, x, y })
    }))
    return { asset: asset.dataset.asset, outside, overlaps, containerCandidates }
  }))
}

try {
  if (gallery) {
    const css = fs.readFileSync('docs/.vuepress/reader/reader.css', 'utf8')
    const assets = [...new Set((originalsOnly ? [] : diagrams.filter((item) => !chapterFilter || chapterFilter.includes(item.chapter)).flatMap((item) =>
      [item.desktop, item.mobile, item.desktopTw, item.mobileTw].filter(Boolean))
      ).concat(chapterFilter ? [] : readCollection('docs/.vuepress/reader/figures').map((item) => item.vector)))]
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    for (const theme of ['light', 'dark']) {
      for (let index = 0; index < assets.length; index += 2) {
        const group = assets.slice(index, index + 2)
        const assetHashes = {}
        const html = group.map((asset) => {
          const svg = fs.readFileSync(path.join('docs/.vuepress/public', asset), 'utf8')
          assetHashes[asset] = sourceHash(svg)
          return `<section class="asset" data-asset="${escape(asset)}"><h2>${escape(asset)}</h2>${svg}</section>`
        }).join('')
        await page.setContent(`<!doctype html><html data-reader-theme="${theme}"><head><style>${css}
          body{padding:24px;display:grid;grid-template-columns:680px 680px;gap:28px}
          .asset h2{font:14px system-ui;margin:0 0 16px}.asset>svg{display:block;width:100%;height:auto}
          .asset[data-asset*="-mobile"]>svg{width:360px;margin:auto}
          </style></head><body>${html}</body></html>`)
        await page.evaluate(() => document.fonts.ready)
        const checks = await geometry(page)
        evidence.push({ theme, assetHashes, readerCssHash: sourceHash(css), checks })
        for (const check of checks) {
          if (check.outside.length || check.overlaps.length || check.containerCandidates.length) failures.push({ theme, ...check })
        }
        await page.screenshot({ path: `${output}/gallery-${theme}-${String(index / 2).padStart(3, '0')}.png`, fullPage: true })
      }
    }
    fs.writeFileSync(`${output}/geometry.json`, JSON.stringify(failures, null, 2))
    fs.writeFileSync(`${output}/gallery-index.json`, JSON.stringify(evidence, null, 2))
    console.log(JSON.stringify({ assetCount: assets.length, screenshots: output, geometryCandidates: failures.length }))
  } else {
    const errors = []
    const pages = chapterFilter || ['README', 'preface', ...Array.from({ length: 22 }, (_, i) => `ch${String(i + 1).padStart(2, '0')}`), 'summary']
    for (const theme of process.argv.includes('--all-themes') ? ['light', 'dark'] : ['light']) {
    const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1440, height: 900 } })
    await context.addInitScript(({ theme, code }) => localStorage.setItem('aposd-reader-preferences-v1',
      JSON.stringify({ theme, size: 19, code, figures: 'svg' })), { theme, code: codeMode })
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`) })
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    for (const locale of ['', 'zh-tw/', 'en/']) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
        for (const chapter of pages) {
          await page.goto(`${base}/${locale}${chapter === 'README' ? 'index' : chapter}.html`, { waitUntil: 'networkidle' })
          await page.locator('#content').waitFor()
          await expect(page.locator('html')).toHaveAttribute('data-reader-theme', theme)
          await page.evaluate(() => document.fonts.ready)
          const expected = (locale === 'en/' ? [] : diagrams.filter((item) => item.chapter === chapter)).map((item) => item.id).sort()
          await expect(page.locator('.chapter-guide[data-diagram-ready="true"]')).toHaveCount(expected.length)
          const actual = await page.locator('.chapter-guide').evaluateAll((elements) => elements.map((element) => element.dataset.diagram).sort())
          assert.deepEqual(actual, expected)
          const state = await page.evaluate(() => ({
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            duplicateIds: [...document.querySelectorAll('[id]')].map((element) => element.id)
              .filter((id, i, all) => all.indexOf(id) !== i),
            brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).map((image) => image.src),
            figures: [...document.querySelectorAll('[data-figure]')].map((element) => [element.dataset.figure, element.dataset.figureMode]),
            activeChapter: document.querySelector('.reader-chapters a[aria-current="page"]')?.getAttribute('href') || null,
          }))
          const source = fs.readFileSync(path.join('docs', locale, `${chapter}.md`), 'utf8')
          const sourceTokens = markdown.parse(source, {})
          let fenceOrdinal = 0
          const expectedExamples = sourceTokens.flatMap((token) => {
            if (token.type !== 'fence') return []
            const id = `${chapter}-f${++fenceOrdinal}`
            return exampleIds.has(id) ? [id] : []
          }).sort()
          const renderedExamples = await page.locator('.code-example').evaluateAll((nodes) =>
            nodes.map((node) => [node.dataset.example, node.dataset.codeMode]))
          assert.deepEqual(renderedExamples.map(([id]) => id).sort(), expectedExamples, `Code coverage ${locale}${chapter}`)
          assert.ok(renderedExamples.every(([, mode]) => mode === codeMode), `Code mode ${locale}${chapter}`)
          if (codeMode === 'python') {
            await expect(page.locator('.code-example-original:visible')).toHaveCount(0)
            await expect(page.locator('#content div.language-java:visible, #content div.language-c:visible, #content div.language-cpp:visible, #content div.language-go:visible')).toHaveCount(0)
          }
          const expectedFigures = sourceTokens.flatMap((token) =>
            (token.children || []).filter((child) => child.type === 'image')
              .map((image) => figureFiles.get(path.basename(image.attrGet('src') || ''))).filter(Boolean)).sort()
          assert.deepEqual(state.figures.map(([id]) => id).sort(), expectedFigures, `Figure coverage ${locale}${chapter}`)
          assert.ok(state.figures.every(([, mode]) => mode === 'svg'), `Vector mode ${locale}${chapter}`)
          if (state.scrollWidth > state.width + 1 || state.duplicateIds.length || state.brokenImages.length || !state.activeChapter) failures.push({ locale, theme, width, chapter, ...state })
          evidence.push({ locale, theme, width, chapter, codeMode, examples: renderedExamples, diagrams: actual, ...state })
          await page.screenshot({ path: `${output}/page-${locale.replace('/', '') || 'zh'}-${theme}-${width}-${chapter}.png` })
        }
      }
    }
    await context.close()
    }
    fs.writeFileSync(`${output}/pages.json`, JSON.stringify(evidence, null, 2))
    fs.writeFileSync(`${output}/page-failures.json`, JSON.stringify({ failures, errors }, null, 2))
    console.log(JSON.stringify({ routesChecked: evidence.length, failures, errors, screenshots: output }, null, 2))
    assert.equal(failures.length, 0)
    assert.deepEqual(errors, [])
  }
} finally {
  await browser.close()
}
