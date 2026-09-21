import { inject, nextTick, reactive, watch } from 'vue'

const key = Symbol('aposd-reader')
const storageKey = 'aposd-reader-preferences-v1'

export function createReaderState() {
  const preferences = reactive({ size: 19, theme: 'light', code: 'original', figures: 'svg', lastRoute: '' })
  let started = false
  const apply = () => {
    document.documentElement.dataset.readerTheme = preferences.theme
    document.documentElement.style.setProperty('--reading-size', `${preferences.size}px`)
    try { localStorage.setItem(storageKey, JSON.stringify(preferences)) } catch {}
  }
  function init() {
    if (started) return
    started = true
    preferences.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (['light', 'dark'].includes(saved.theme)) preferences.theme = saved.theme
      if (['original', 'python'].includes(saved.code)) preferences.code = saved.code
      if (['original', 'svg'].includes(saved.figures)) preferences.figures = saved.figures
      if (Number.isFinite(saved.size)) preferences.size = Math.max(16, Math.min(22, Math.round(saved.size)))
      if (typeof saved.lastRoute === 'string' && saved.lastRoute.startsWith('/')) preferences.lastRoute = saved.lastRoute
    } catch {}
    apply()
    watch(preferences, apply, { flush: 'post' })
  }
  async function resize(size: number) {
    const target = [...document.querySelectorAll('#content > p, #content > h2')]
      .find((node) => node.getBoundingClientRect().bottom > 100)
    const top = target?.getBoundingClientRect().top || 0
    preferences.size = Math.max(16, Math.min(22, size))
    await nextTick()
    if (target) window.scrollBy(0, target.getBoundingClientRect().top - top)
  }
  return { preferences, init, resize }
}

export function provideReader(app) { app.provide(key, createReaderState()) }
export function useReader() {
  const state = inject<ReturnType<typeof createReaderState>>(key)
  if (!state) throw new Error('Reader state is unavailable')
  return state
}
