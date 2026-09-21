import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onContentUpdated } from 'vuepress/client'

export function useReadingAnchor() {
  const route = useRoute()
  const router = useRouter()
  let hash = ''
  let path = ''
  let frame = 0
  let historyNavigation = false

  const cancel = () => { hash = '' }
  function schedule() {
    if (!hash || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (!hash || path !== route.fullPath) return
      const content = document.getElementById('content')
      if (!content || document.fonts.status === 'loading') return
      const images = [...content.querySelectorAll('img')].filter((image) => image.getClientRects().length)
      if (images.some((image) => !image.complete)) return
      const guides = [...content.querySelectorAll<HTMLElement>('.chapter-guide')]
      if (guides.some((guide) => guide.dataset.diagramReady !== 'true' && !guide.querySelector('.diagram-status'))) return
      let id: string
      try { id = decodeURIComponent(hash.slice(1)) } catch { cancel(); return }
      const anchor = document.getElementById(id)
      const target = anchor?.classList.contains('reader-section-anchor') ? anchor.parentElement : anchor
      if (!target) return
      const offset = (document.querySelector('.reader-topbar')?.getBoundingClientRect().height || 52) + 24
      window.scrollTo({ top: Math.max(0, scrollY + target.getBoundingClientRect().top - offset), behavior: 'auto' })
      if (target.matches('.reader-footnote,[data-reader-footnote="reference"]')) {
        target.focus({ preventScroll: true })
      }
      cancel()
    })
  }
  function start() {
    hash = historyNavigation ? '' : route.hash
    path = route.fullPath
    historyNavigation = false
    nextTick(schedule)
  }
  function imageSettled(event: Event) {
    if ((event.target as Element)?.closest?.('#content')) schedule()
  }
  function popstate() { historyNavigation = true; cancel() }
  function followFootnote(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>('#content a[data-reader-footnote]') : null
    if (!link?.hash || link.pathname !== location.pathname) return
    event.preventDefault()
    // A hash-only update re-encodes slashes in VuePress's catch-all locale route.
    void router.push({ path: route.path, query: route.query, hash: link.hash }).then(() => {
      if (route.hash === link.hash) start()
    })
  }
  watch(() => route.fullPath, () => { if (typeof window !== 'undefined') start() })
  onContentUpdated(() => nextTick(schedule))
  onMounted(() => {
    // Align once after asynchronous figure layout settles; user intent cancels it.
    if (!history.state?.scroll) start()
    window.addEventListener('popstate', popstate)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    document.addEventListener('pointerdown', cancel)
    document.addEventListener('keydown', cancel)
    document.addEventListener('click', followFootnote)
    document.addEventListener('load', imageSettled, true)
    document.addEventListener('error', imageSettled, true)
    document.addEventListener('reader:layout-ready', schedule)
    document.fonts.ready.then(schedule)
  })
  onBeforeUnmount(() => {
    cancel()
    cancelAnimationFrame(frame)
    window.removeEventListener('popstate', popstate)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
    document.removeEventListener('pointerdown', cancel)
    document.removeEventListener('keydown', cancel)
    document.removeEventListener('click', followFootnote)
    document.removeEventListener('load', imageSettled, true)
    document.removeEventListener('error', imageSettled, true)
    document.removeEventListener('reader:layout-ready', schedule)
  })
}
