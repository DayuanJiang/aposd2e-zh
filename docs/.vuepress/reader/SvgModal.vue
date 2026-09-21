<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { ClientOnly, usePageLang, withBase } from 'vuepress/client'
import { Download, Minus, Plus, RotateCw, Scan, X } from '@lucide/vue'
import { parseSvg, scopedSvg } from './svg'

const props = defineProps<{ title: string, asset: string, filename: string }>()
const lang = usePageLang()
const text = (zh: string, tw: string, en: string) => lang.value.startsWith('en') ? en : lang.value === 'zh-TW' ? tw : zh
const id = useId()
const dialog = ref<HTMLDialogElement>()
const viewport = ref<HTMLElement>()
const svg = ref('')
const failed = ref(false)
const scale = ref(1)
const dimensions = ref({ width: 680, height: 460 })
let opener: HTMLElement | null = null
let raw = ''
let version = 0

function fit() {
  if (!viewport.value) return
  scale.value = Math.max(0.1, Math.min(
    4,
    (viewport.value.clientWidth - 48) / dimensions.value.width,
    (viewport.value.clientHeight - 48) / dimensions.value.height,
  ))
}
async function load(source = '') {
  const current = ++version
  failed.value = false
  svg.value = ''
  try {
    if (!source) {
      const response = await fetch(withBase(props.asset))
      if (!response.ok) throw new Error('Figure unavailable')
      source = await response.text()
    }
    if (current !== version) return
    const root = parseSvg(source)
    const viewBox = root.getAttribute('viewBox')?.split(/\s+/).map(Number)
    if (!viewBox || viewBox.length !== 4 || !viewBox.every(Number.isFinite)) throw new Error('Missing viewBox')
    raw = source
    dimensions.value = { width: viewBox[2], height: viewBox[3] }
    svg.value = scopedSvg(source, `modal-${id}`)
    await nextTick()
    fit()
  } catch { if (current === version) failed.value = true }
}
async function open(event: Event, source = '', focusTarget?: HTMLElement) {
  opener = focusTarget || event.currentTarget as HTMLElement
  dialog.value?.showModal()
  document.body.classList.add('reader-diagram-open')
  await load(source)
}
function closed() {
  version += 1
  if (!document.querySelector('.reader-diagram-dialog[open]')) document.body.classList.remove('reader-diagram-open')
  if (opener?.isConnected) opener.focus()
}
function download() {
  const url = URL.createObjectURL(new Blob([raw], { type: 'image/svg+xml' }))
  const link = document.createElement('a')
  link.href = url
  link.download = props.filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
watch(() => props.asset, () => { if (dialog.value?.open) load() })
onBeforeUnmount(() => {
  version += 1
  if (dialog.value?.open) dialog.value.close()
  if (!document.querySelector('.reader-diagram-dialog[open]')) document.body.classList.remove('reader-diagram-open')
})
defineExpose({ open })
</script>

<template>
  <ClientOnly><Teleport to="body">
    <dialog ref="dialog" class="reader-diagram-dialog" :aria-label="title" @close="closed">
      <header><h2>{{ title }}</h2><div class="diagram-controls">
        <button class="reader-icon-button" type="button" :aria-label="text('缩小', '縮小', 'Zoom out')" :title="text('缩小', '縮小', 'Zoom out')" :disabled="!svg || scale <= 0.1" @click="scale = Math.max(0.1, scale / 1.2)"><Minus /></button>
        <output>{{ Math.round(scale * 100) }}%</output>
        <button class="reader-icon-button" type="button" :aria-label="text('放大', '放大', 'Zoom in')" :title="text('放大', '放大', 'Zoom in')" :disabled="!svg || scale >= 4" @click="scale = Math.min(4, scale * 1.2)"><Plus /></button>
        <button class="reader-icon-button" type="button" :aria-label="text('适应窗口', '適應視窗', 'Fit to window')" :title="text('适应窗口', '適應視窗', 'Fit to window')" :disabled="!svg" @click="fit"><Scan /></button>
        <button class="reader-icon-button" type="button" :aria-label="text('下载 SVG', '下載 SVG', 'Download SVG')" :title="text('下载 SVG', '下載 SVG', 'Download SVG')" :disabled="!svg" @click="download"><Download /></button>
        <button class="reader-icon-button" type="button" :aria-label="text('关闭图解', '關閉圖解', 'Close diagram')" :title="text('关闭图解', '關閉圖解', 'Close diagram')" @click="dialog?.close()"><X /></button>
      </div></header>
      <div ref="viewport" class="diagram-viewport">
        <div v-if="svg" class="diagram-canvas"><div :style="{ width: `${dimensions.width * scale}px`, height: `${dimensions.height * scale}px` }" v-html="svg" /></div>
        <div v-else class="diagram-status" role="status">
          <button v-if="failed" type="button" @click="load()"><RotateCw :size="16" /> {{ text('重新加载图解', '重新載入圖解', 'Reload diagram') }}</button>
          <span v-else>{{ text('加载中…', '載入中…', 'Loading…') }}</span>
        </div>
      </div>
    </dialog>
  </Teleport></ClientOnly>
</template>
