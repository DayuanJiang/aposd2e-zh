import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium, expect } from '@playwright/test'
import { readCollection } from '../docs/.vuepress/reader/content.mjs'

const base = process.env.READER_URL || 'http://127.0.0.1:8084/aposd2e-zh'
const output = process.env.READER_SHOTS || '/tmp/aposd2e-reader-resilience'
const key = 'aposd-reader-preferences-v1'
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
fs.mkdirSync(output, { recursive: true })
const observations = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(({ key }) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, '{invalid')
      sessionStorage.setItem('seeded', 'yes')
    }
  }, { key })
  await page.goto(`${base}/ch02.html`, { waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveAttribute('data-reader-theme', 'light')
  await expect(page.locator('html')).toHaveCSS('--reading-size', '19px')
  await page.evaluate(({ key }) => localStorage.setItem(key, JSON.stringify({
    theme: 'not-a-theme', size: 999, code: 'not-a-language', figures: 'not-a-mode',
  })), { key })
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.locator('html')).toHaveCSS('--reading-size', '22px')
  await expect(page.locator('[data-figure="00010"]')).toHaveAttribute('data-figure-mode', 'svg')
  observations.push('Corrupt storage and invalid preferences fall back; size is clamped.')

  const figurePattern = '**/figures/00010.svg'
  let abortedImages = 0
  await page.route(figurePattern, (route) => { abortedImages += 1; return route.abort() })
  await page.reload({ waitUntil: 'networkidle' })
  assert.ok(abortedImages > 0, 'The failure fixture must intercept the SVG request')
  await expect(page.locator('[data-figure="00010"]')).toHaveAttribute('data-figure-mode', 'original')
  await page.unroute(figurePattern)
  await page.getByRole('button', { name: '阅读设置', exact: true }).click()
  const vectorOption = page.getByRole('checkbox', { name: '原图用 SVG 显示', exact: true })
  await vectorOption.uncheck()
  await vectorOption.check()
  await page.keyboard.press('Escape')
  const figure = page.locator('[data-figure="00010"]')
  await expect(figure).toHaveAttribute('data-figure-mode', 'svg')
  await expect.poll(() => figure.locator('.original-vector-scroll img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
  observations.push('Failed vector image falls back to raster, and toggling retries successfully.')

  const diagram = readCollection('docs/.vuepress/reader/diagrams').find((item) => item.chapter === 'ch02')
  const diagramPattern = `**${diagram.desktop}`
  await page.route(diagramPattern, (route) => route.abort())
  await page.reload({ waitUntil: 'networkidle' })
  const guide = page.locator(`[data-diagram="${diagram.id}"]`)
  await expect(guide.getByRole('button', { name: '重新加载图解', exact: true })).toBeVisible()
  await page.unroute(diagramPattern)
  await guide.getByRole('button', { name: '重新加载图解', exact: true }).click()
  await expect(guide).toHaveAttribute('data-diagram-ready', 'true')
  observations.push('A failed explanatory SVG can be reloaded in place.')

  await page.route(figurePattern, (route) => route.abort())
  await figure.getByRole('button', { name: '放大原图', exact: true }).click()
  const modal = page.locator('dialog[open]')
  await expect(modal.getByRole('button', { name: '重新加载图解', exact: true })).toBeVisible()
  await page.unroute(figurePattern)
  await modal.getByRole('button', { name: '重新加载图解', exact: true }).click()
  await expect(modal.locator('svg.chapter-svg')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(figure.getByRole('button', { name: '放大原图', exact: true })).toBeFocused()
  observations.push('Modal load failure and recovery preserve keyboard dismissal and focus.')

  await page.getByRole('button', { name: '阅读设置', exact: true }).click()
  await vectorOption.uncheck()
  await page.keyboard.press('Escape')
  await figure.locator('.original-raster img').evaluate((image) => {
    image.addEventListener('medium-zoom:opened', () => { image.dataset.zoomReady = 'true' }, { once: true })
  })
  await figure.getByRole('button', { name: '放大原图', exact: true }).click()
  await expect(figure.locator('.original-raster img')).toHaveAttribute('data-zoom-ready', 'true')
  await expect(page.locator('.medium-zoom-image--opened')).toHaveCSS('transition-duration', '0.001s')
  await page.keyboard.press('Escape')
  await expect(page.locator('.medium-zoom-image--opened')).toHaveCount(0)
  await expect(figure.getByRole('button', { name: '放大原图', exact: true })).toBeFocused()
  observations.push('Original-image zoom opens/closes with reduced motion and restores focus.')

  await page.evaluate(({ key }) => localStorage.setItem(key, JSON.stringify({ theme: 'dark', size: 22, code: 'python', figures: 'svg' })), { key })
  for (const width of [320, 600, 900, 1320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const chapter of ['ch02', 'ch10', 'ch13']) {
      await page.goto(`${base}/${chapter}.html`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('html')).toHaveCSS('--reading-size', '22px')
      const sizes = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth])
      assert.ok(sizes[1] <= sizes[0] + 1, `${chapter} at ${width}px overflows: ${sizes}`)
      await page.screenshot({ path: `${output}/${chapter}-${width}-dark-large.png` })
    }
  }
  observations.push('Three dense chapters fit four breakpoint widths with dark theme, Python and 22px body text.')
  const headingId = await page.locator('#content h2[id]').last().getAttribute('id')
  const coldContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' })
  const coldPage = await coldContext.newPage()
  await coldPage.goto(`${base}/ch13.html#${encodeURIComponent(headingId)}`, { waitUntil: 'networkidle' })
  const chapterDiagrams = readCollection('docs/.vuepress/reader/diagrams').filter((entry) => entry.chapter === 'ch13')
  await expect(coldPage.locator('.chapter-guide[data-diagram-ready="true"]')).toHaveCount(chapterDiagrams.length)
  await coldPage.evaluate(() => document.fonts.ready)
  await expect.poll(() => coldPage.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, headingId)).toBeLessThanOrEqual(200)
  const anchorTop = await coldPage.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, headingId)
  assert.ok(anchorTop >= 52 && anchorTop <= 200, `Cold anchor hidden or displaced: ${anchorTop}`)
  observations.push(`A cold mobile deep link remains visible after diagrams load (heading top ${Math.round(anchorTop)}px).`)
  assert.deepEqual(errors, [])
  const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const staticPage = await staticContext.newPage()
  await staticPage.goto(`${base}/ch02.html`, { waitUntil: 'networkidle' })
  await expect(staticPage.locator('h1')).toContainText('复杂性的本质')
  await expect(staticPage.locator('#content')).toContainText('认知负荷')
  const broken = await staticPage.evaluate(() => [...document.images].filter((image) => image.complete && !image.naturalWidth).map((image) => image.src))
  assert.deepEqual(broken, [])
  await staticPage.screenshot({ path: `${output}/no-javascript.png` })
  observations.push('Server-rendered body and figure fallbacks remain readable with JavaScript disabled.')
  fs.writeFileSync(`${output}/result.json`, JSON.stringify({ observations, errors, result: 'passed' }, null, 2))
  console.log(JSON.stringify({ observations, result: 'passed', screenshots: output }, null, 2))
} finally { await browser.close() }
