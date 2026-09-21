<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { onContentUpdated, usePageData } from 'vuepress/client'
import DefaultLayout from '@vuepress/theme-default/layouts/Layout.vue'
import { useHeaders } from '@theme/useHeaders'
import { Menu, X, Type, Minus, Plus, Sun, Moon, List, Search, Languages, GitBranch, ArrowRight } from '@lucide/vue'
import book from '@temp/reader/book'
import { useReader } from './state'
import { useReadingAnchor } from './anchor'

const route = useRoute()
useReadingAnchor()
const router = useRouter()
const page = usePageData()
const pageHeaders = useHeaders()
const { preferences, resize } = useReader()
const locale = computed(() => page.value.reader?.locale || '')
const english = computed(() => locale.value === 'en')
const text = (zh: string, en: string, tw = zh) => english.value ? en : locale.value === 'zh-tw' ? tw : zh
const chapters = computed(() => book[locale.value] || book[''])
const everyChapter = Object.values(book).flat()
const home = computed(() => chapters.value[0]?.path)
const resume = computed(() => {
  const target = preferences.lastRoute
  if (!target || target === route.path) return undefined
  return everyChapter.find((chapter) => chapter.path === target)
})
watch(() => route.path, (path) => {
  const current = everyChapter.find((chapter) => chapter.path === path)
  if (current && current.id !== 'README') preferences.lastRoute = path
}, { immediate: true })
const sidebarOpen = ref(false)
const narrow = ref(false)
const sidebarHidden = ref(false)
const tocOpen = ref(false)
const settingsOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()
const settingsButton = ref<HTMLButtonElement>()
const tocButton = ref<HTMLButtonElement>()
const sidebar = ref<HTMLElement>()
const settings = ref<HTMLElement>()
const toc = ref<HTMLElement>()
const query = ref('')
const searchData = ref<Record<string, any[]>>({})
const searchError = ref(false)
const loadingSearch = ref(false)
const activeHeading = ref('')
const progress = ref(0)
let observer: IntersectionObserver | undefined
let frame = 0

const headers = computed(() => {
  const flatten = (items, depth = 2) => items.flatMap((item) =>
    [{ ...item, depth }, ...flatten(item.children || [], depth + 1)])
  return flatten(pageHeaders.value)
})
const results = computed(() => {
  const value = query.value.trim().toLocaleLowerCase()
  if (!value || !searchData.value[locale.value]) return []
  return searchData.value[locale.value].map((entry) => {
    const at = entry.text.toLocaleLowerCase().indexOf(value)
    const titleMatch = entry.title.toLocaleLowerCase().includes(value)
    return { ...entry, match: at >= 0 || titleMatch, score: titleMatch ? 1 : 0,
      excerpt: at < 0 ? entry.text.slice(0, 100) : entry.text.slice(Math.max(0, at - 32), at + value.length + 70) }
  }).filter((entry) => entry.match).sort((a, b) => b.score - a.score).slice(0, 20)
})
const searchLoaders = {
  '': () => import('@temp/reader/search-zh'),
  'zh-tw': () => import('@temp/reader/search-zh-tw'),
  en: () => import('@temp/reader/search-en'),
}
watch([query, locale], async ([value, language]) => {
  if (!value.trim() || searchData.value[language]) return
  loadingSearch.value = true
  searchError.value = false
  try { searchData.value[language] = (await searchLoaders[language]()).default }
  catch { searchError.value = true }
  finally { loadingSearch.value = false }
})

function toggleMenu() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    sidebarOpen.value = !sidebarOpen.value
    tocOpen.value = false
    if (sidebarOpen.value) nextTick(() => sidebar.value?.querySelector<HTMLInputElement>('input')?.focus())
  } else sidebarHidden.value = !sidebarHidden.value
}
function closeSidebar() {
  sidebarOpen.value = false
  menuButton.value?.focus()
}
function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  if (settingsOpen.value) nextTick(() => settings.value?.querySelector<HTMLElement>('button:not(:disabled),input')?.focus())
}
function closeToc(restoreFocus = true) {
  tocOpen.value = false
  if (restoreFocus) tocButton.value?.focus()
}
function toggleToc() {
  tocOpen.value = !tocOpen.value
  sidebarOpen.value = false
  if (tocOpen.value) nextTick(() => (
    toc.value?.querySelector<HTMLElement>('a[aria-current="location"]') ||
    toc.value?.querySelector<HTMLElement>('a,button')
  )?.focus())
}
function changeLocale(event: Event) {
  const next = (event.target as HTMLSelectElement).value
  const id = page.value.reader?.chapter || (route.path.includes('preface') ? 'preface' : route.path.includes('summary') ? 'summary' : 'README')
  const target = book[next].find((chapter) => chapter.id === id) || book[next][0]
  router.push(target.path)
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (settingsOpen.value) { settingsOpen.value = false; settingsButton.value?.focus() }
    else if (tocOpen.value) closeToc()
    else if (sidebarOpen.value) closeSidebar()
  }
  const panel = settingsOpen.value ? settings.value : tocOpen.value ? toc.value : sidebarOpen.value ? sidebar.value : undefined
  if (event.key === 'Tab' && panel) {
    const items = [...panel.querySelectorAll<HTMLElement>('a,button,input')]
      .filter((el) => el.getClientRects().length && !el.matches(':disabled'))
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.shiftKey && index <= 0) { event.preventDefault(); items.at(-1)?.focus() }
    else if (!event.shiftKey && (index < 0 || index === items.length - 1)) { event.preventDefault(); items[0]?.focus() }
  }
}
function outside(event: PointerEvent) {
  if (settingsOpen.value && !settings.value?.contains(event.target as Node) &&
      !settingsButton.value?.contains(event.target as Node)) settingsOpen.value = false
  if (tocOpen.value && !toc.value?.contains(event.target as Node) &&
      !tocButton.value?.contains(event.target as Node)) closeToc(false)
}
function updateProgress() {
  narrow.value = innerWidth <= 900
  if (frame) return
  frame = requestAnimationFrame(() => {
    const total = document.documentElement.scrollHeight - innerHeight
    progress.value = total > 0 ? Math.max(0, Math.min(100, scrollY / total * 100)) : 100
    const nodes = [...document.querySelectorAll<HTMLElement>('#content h2[id],#content h3[id]')]
    activeHeading.value = (nodes.filter((node) => node.getBoundingClientRect().top <= 150).at(-1) || nodes[0])?.id || ''
    frame = 0
  })
}
async function refreshed() {
  const path = route.path
  sidebarOpen.value = false
  tocOpen.value = false
  settingsOpen.value = false
  await nextTick()
  if (path !== route.path) return
  observer?.disconnect()
  observer = new IntersectionObserver(updateProgress, { rootMargin: '-56px 0px -65% 0px' })
  document.querySelectorAll('#content h2[id],#content h3[id]').forEach((node) => observer?.observe(node))
  updateProgress()
}
onContentUpdated(refreshed)
onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress)
  document.addEventListener('keydown', keydown)
  document.addEventListener('pointerdown', outside)
  refreshed()
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', updateProgress)
  document.removeEventListener('keydown', keydown)
  document.removeEventListener('pointerdown', outside)
})
</script>

<template>
  <div class="reader-app" :class="{ 'reader-menu-open': sidebarOpen, 'reader-menu-hidden': sidebarHidden }">
    <a href="#content" class="reader-skip">{{ text('跳到正文', 'Skip to content') }}</a>
    <DefaultLayout class="book-reader">
      <template #navbar>
        <header class="reader-topbar">
          <button ref="menuButton" class="reader-icon-button" type="button" :title="text('章节目录', 'Chapters', '章節目錄')" :aria-label="text('章节目录', 'Chapters', '章節目錄')" :aria-expanded="narrow ? sidebarOpen : !sidebarHidden" aria-controls="reader-sidebar" @click="toggleMenu"><Menu /></button>
          <span class="reader-brand">{{ text('软件设计的哲学', 'A Philosophy of Software Design', '軟體設計的哲學') }}</span>
          <div class="reader-topbar-controls">
            <div class="reader-segments reader-code-switch" role="group" :aria-label="text('示例语言', 'Example language', '範例語言')">
              <button type="button" :aria-pressed="preferences.code === 'original'" @click="preferences.code = 'original'">{{ text('原例', 'Original') }}</button>
              <button type="button" :aria-pressed="preferences.code === 'python'" @click="preferences.code = 'python'">Python</button>
            </div>
            <label class="reader-language" :title="text('阅读语言', 'Reading language', '閱讀語言')"><Languages aria-hidden="true" /><select :aria-label="text('阅读语言', 'Reading language', '閱讀語言')" :value="locale" @change="changeLocale"><option value="">简体</option><option value="zh-tw">繁體</option><option value="en">EN</option></select></label>
            <button ref="settingsButton" type="button" class="reader-icon-button" :title="text('阅读设置', 'Reading settings', '閱讀設定')" :aria-label="text('阅读设置', 'Reading settings', '閱讀設定')" :aria-expanded="settingsOpen" aria-controls="reader-settings" @click="toggleSettings"><Type /></button>
            <button ref="tocButton" type="button" class="reader-icon-button reader-toc-toggle" :title="text('本章目录', 'On this page', '本章目錄')" :aria-label="text('本章目录', 'On this page', '本章目錄')" :aria-expanded="tocOpen" aria-controls="reader-toc" @click="toggleToc"><List /></button>
          </div>
          <div class="reader-progress" role="progressbar" :aria-label="text('阅读进度', 'Reading progress', '閱讀進度')" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100"><span :style="{ transform: `scaleX(${progress / 100})` }" /></div>
        </header>
      </template>
      <template #page-top>
        <div v-if="route.path === home && resume" class="reader-resume">
          <span>{{ text('上次读到', 'Last read', '上次讀到') }}</span>
          <RouterLink class="reader-resume-title" :to="resume.path">{{ resume.title }}</RouterLink>
          <RouterLink class="reader-resume-go" :to="resume.path">{{ text('继续阅读', 'Continue reading', '繼續閱讀') }}<ArrowRight aria-hidden="true" /></RouterLink>
        </div>
      </template>
      <template #sidebar>
        <aside id="reader-sidebar" ref="sidebar" class="reader-sidebar" :inert="narrow && !sidebarOpen" :aria-label="text('章节目录', 'Chapters', '章節目錄')">
          <div class="reader-book-title">
            <RouterLink :to="chapters[0].path">{{ text('软件设计的哲学', 'A Philosophy of Software Design', '軟體設計的哲學') }}</RouterLink>
            <small>A Philosophy of Software Design<br>{{ text('第二版', 'Second Edition') }}</small>
            <button class="reader-icon-button reader-sidebar-close" type="button" :aria-label="text('关闭目录', 'Close chapters', '關閉目錄')" @click="closeSidebar"><X /></button>
          </div>
          <div class="reader-search">
            <label><Search aria-hidden="true" /><input v-model="query" type="search" :placeholder="text('搜索全书', 'Search book', '搜尋全書')" :aria-label="text('搜索全书', 'Search book', '搜尋全書')" /><button v-if="query" type="button" class="reader-icon-button" :aria-label="text('清除搜索', 'Clear search', '清除搜尋')" @click="query = ''"><X /></button></label>
          </div>
          <nav v-if="!query.trim()" class="reader-chapters">
            <RouterLink v-for="chapter in chapters" :key="chapter.id" :to="chapter.path" :aria-current="route.path === chapter.path ? 'page' : undefined" @click="sidebarOpen = false">{{ chapter.title }}</RouterLink>
          </nav>
          <div v-else class="reader-search-results" aria-live="polite">
            <p v-if="loadingSearch">{{ text('搜索中…', 'Searching…', '搜尋中…') }}</p>
            <p v-else-if="searchError">{{ text('搜索暂不可用，请重试。', 'Search unavailable. Please retry.', '搜尋暫不可用，請重試。') }}</p>
            <p v-else-if="!results.length">{{ text('没有找到匹配内容', 'No matches found', '沒有找到符合內容') }}</p>
            <RouterLink v-for="result in results" :key="result.id" :to="result.path" @click="sidebarOpen = false"><strong>{{ result.title }}</strong><span>{{ result.excerpt }}</span></RouterLink>
          </div>
          <a class="reader-repo" href="https://github.com/DayuanJiang/aposd2e-zh" target="_blank" rel="noopener noreferrer"><GitBranch /> GitHub</a>
        </aside>
      </template>
    </DefaultLayout>
    <button v-if="sidebarOpen" type="button" class="reader-scrim" :aria-label="text('收起目录', 'Close chapters', '收起目錄')" @click="closeSidebar" />
    <nav id="reader-toc" ref="toc" class="reader-toc" :class="{ 'is-open': tocOpen }" :aria-label="text('本章目录', 'On this page', '本章目錄')">
      <h2>{{ text('本章目录', 'On this page', '本章目錄') }}</h2>
      <button type="button" class="reader-icon-button reader-toc-close" :aria-label="text('关闭本章目录', 'Close contents', '關閉本章目錄')" @click="closeToc()"><X /></button>
      <a v-for="header in headers" :key="header.slug" :href="`#${header.slug}`" :data-depth="header.depth" :aria-current="activeHeading === header.slug ? 'location' : undefined" @click="tocOpen = false">{{ header.title }}</a>
    </nav>
    <section v-if="settingsOpen" id="reader-settings" ref="settings" class="reader-settings" :aria-label="text('阅读设置', 'Reading settings', '閱讀設定')">
      <h2>{{ text('阅读设置', 'Reading settings', '閱讀設定') }}</h2>
      <div class="reader-settings-row"><span>{{ text('字号', 'Text size', '字級') }}</span><div class="reader-size-control"><button type="button" class="reader-icon-button" :aria-label="text('减小字号', 'Decrease text size', '減小字級')" :disabled="preferences.size <= 16" @click="resize(preferences.size - 1)"><Minus /></button><output>{{ preferences.size }}</output><button type="button" class="reader-icon-button" :aria-label="text('增大字号', 'Increase text size', '增大字級')" :disabled="preferences.size >= 22" @click="resize(preferences.size + 1)"><Plus /></button></div></div>
      <div class="reader-settings-row"><span>{{ text('外观', 'Appearance', '外觀') }}</span><button type="button" class="reader-icon-button" :title="text('切换浅色或深色', 'Toggle light and dark', '切換淺色或深色')" :aria-label="text('切换浅色或深色', 'Toggle light and dark', '切換淺色或深色')" @click="preferences.theme = preferences.theme === 'light' ? 'dark' : 'light'"><Moon v-if="preferences.theme === 'light'" /><Sun v-else /></button></div>
      <div class="reader-settings-row"><label for="reader-vector-figures">{{ text('原图用 SVG 显示', 'Use vector figures', '原圖以 SVG 顯示') }}</label><input id="reader-vector-figures" v-model="preferences.figures" type="checkbox" true-value="svg" false-value="original" /></div>
    </section>
  </div>
</template>
