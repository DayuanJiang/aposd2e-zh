<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { usePageLang, withBase } from 'vuepress/client'
import { BookOpen, ChevronDown, Download, Expand } from '@lucide/vue'
import diagrams from '@temp/reader/diagrams'
import SvgModal from './SvgModal.vue'
import { scopedSvg } from './svg'

const props = defineProps<{ chapter: string, diagramId?: string }>()
const lang = usePageLang()
const id = useId()
const mobile = ref(false)
const svg = ref('')
const error = ref(false)
const modal = ref<InstanceType<typeof SvgModal>>()
let media: MediaQueryList | undefined
let request = 0
let raw = ''
const diagramId = computed(() => props.diagramId || props.chapter)
const meta = computed(() => diagrams[diagramId.value])
const traditional = computed(() => lang.value === 'zh-TW')
const title = computed(() => traditional.value ? meta.value?.titleTw || meta.value?.title : meta.value?.title)
const summary = computed(() => traditional.value ? meta.value?.summaryTw || meta.value?.summary : meta.value?.summary)
const kindLabel = computed(() => {
  const kind = meta.value?.kind
  if (kind === 'chapter-map') return traditional.value ? '本章概覽' : '本章概览'
  if (kind === 'chapter-story') return traditional.value ? '本章回顧' : '本章回顾'
  return traditional.value ? '譯者圖解' : '译者图解'
})
function download() {
  const url = URL.createObjectURL(new Blob([raw], { type: 'image/svg+xml' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${diagramId.value}.svg`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const asset = computed(() => {
  const data = meta.value
  if (!data) return ''
  if (traditional.value) return mobile.value ? data.mobileTw || data.mobile : data.desktopTw || data.desktop
  return mobile.value ? data.mobile : data.desktop
})
async function load() {
  if (!asset.value) return
  const version = ++request
  error.value = false
  svg.value = ''
  try {
    const response = await fetch(withBase(asset.value))
    if (!response.ok) throw new Error('Diagram unavailable')
    const source = await response.text()
    if (version !== request) return
    raw = source
    svg.value = scopedSvg(source, `inline-${id}`)
  } catch { if (version === request) error.value = true }
  finally {
    await nextTick()
    if (version === request) document.dispatchEvent(new Event('reader:layout-ready'))
  }
}
const changed = () => { mobile.value = media?.matches || false }
onMounted(() => {
  media = matchMedia('(max-width: 600px)')
  mobile.value = media.matches
  media.addEventListener('change', changed)
  load()
})
watch(asset, load)
onBeforeUnmount(() => { request += 1; media?.removeEventListener('change', changed) })
</script>

<template>
  <figure v-if="meta" class="chapter-guide" :data-chapter="chapter" :data-diagram="diagramId" :data-kind="meta.kind || 'guide'" :data-diagram-ready="Boolean(svg)">
    <details open>
      <summary><span class="guide-kind"><BookOpen />{{ kindLabel }}</span><span>{{ title }}</span><ChevronDown class="guide-chevron" /></summary>
      <div class="diagram-toolbar"><button class="reader-icon-button" type="button" :title="traditional ? '下載 SVG' : '下载 SVG'" :aria-label="traditional ? '下載 SVG' : '下载 SVG'" :disabled="!svg" @click="download"><Download /></button><button class="reader-icon-button" type="button" :title="traditional ? '放大圖解' : '放大图解'" :aria-label="traditional ? '放大圖解' : '放大图解'" :disabled="!svg" @click="modal?.open($event, raw)"><Expand /></button></div>
      <div v-if="svg" class="diagram-stage" :data-layout="mobile ? 'mobile' : 'desktop'" v-html="svg" />
      <div v-else-if="error" class="diagram-status"><button type="button" @click="load">{{ traditional ? '重新載入圖解' : '重新加载图解' }}</button></div>
      <img v-else class="diagram-fallback" :src="withBase(asset)" :alt="traditional ? meta.altTw || meta.alt : meta.alt" />
    </details>
    <SvgModal ref="modal" :asset="asset" :title="title" :filename="`${diagramId}.svg`" />
    <figcaption>{{ summary }}</figcaption>
  </figure>
</template>
