<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { usePageLang, withBase } from 'vuepress/client'
import { useMediumZoom } from '@vuepress/plugin-medium-zoom/client'
import { Download, Expand } from '@lucide/vue'
import figures from '@temp/reader/figures'
import { useReader } from './state'
import SvgModal from './SvgModal.vue'

const props = defineProps<{ figureId: string }>()
const { preferences } = useReader()
const lang = usePageLang()
const zoom = useMediumZoom()
const root = ref<HTMLElement>()
const modal = ref<InstanceType<typeof SvgModal>>()
const failed = ref(false)
const meta = computed(() => figures[props.figureId])
const vector = computed(() => preferences.figures === 'svg' && !failed.value)
const english = computed(() => lang.value.startsWith('en'))
const traditional = computed(() => lang.value === 'zh-TW')
const label = computed(() => english.value ? 'Vector reproduction' : traditional.value ? '原圖 SVG 復現' : '原图 SVG 复现')
const width = computed(() => meta.value.kind === 'figure'
  ? ['00020', '00021'].includes(props.figureId) ? meta.value.width : Math.min(680, Math.max(meta.value.width, 480))
  : meta.value.kind === 'formula' ? meta.value.width * 2 : meta.value.width)
function expand(event: Event) {
  if (vector.value) { modal.value?.open(event, '', root.value?.querySelector('button') || undefined); return }
  const image = root.value?.querySelector<HTMLElement>(vector.value ? '.original-vector-scroll img' : '.original-raster img')
  if (image) {
    const trigger = event.currentTarget as HTMLElement
    image.addEventListener('medium-zoom:closed', () => { if (trigger.isConnected) trigger.focus() }, { once: true })
    zoom?.open({ target: image })
  }
}
async function refresh() { await nextTick(); zoom?.refresh() }
onMounted(() => {
  const image = root.value?.querySelector<HTMLImageElement>('.original-vector-scroll img')
  // An SSR image can finish failing before Vue attaches its error listener.
  if (image?.complete && !image.naturalWidth) failed.value = true
  refresh()
})
watch(vector, refresh)
watch(() => preferences.figures, () => { failed.value = false })
</script>

<template>
  <span ref="root" class="original-figure" :class="`original-figure-${meta.kind}`" :data-figure="figureId" :data-figure-mode="vector ? 'svg' : 'original'">
    <span v-show="!vector" class="original-raster" role="img" :aria-label="meta.alt"><slot /></span>
    <span v-show="vector" class="original-vector-scroll">
      <img v-if="preferences.figures === 'svg'" :src="withBase(meta.vector)" :alt="meta.alt" :width="width" :height="width * meta.height / meta.width" :style="{ width: `${width}px`, minWidth: meta.kind === 'figure' ? `${width}px` : undefined }" @click.stop="expand" @error="failed = true" />
    </span>
    <span v-if="meta.kind === 'figure'" class="original-figure-tools">
      <small>{{ vector ? label : english ? 'Original figure' : traditional ? '原圖' : '原图' }}</small>
      <button type="button" class="reader-icon-button" :title="english ? 'Enlarge figure' : traditional ? '放大原圖' : '放大原图'" :aria-label="english ? 'Enlarge figure' : traditional ? '放大原圖' : '放大原图'" @click="expand"><Expand /></button>
      <a v-if="vector" :href="withBase(meta.vector)" :download="`${figureId}.svg`" class="reader-icon-button" :title="english ? 'Download SVG' : traditional ? '下載 SVG' : '下载 SVG'" :aria-label="english ? 'Download SVG' : traditional ? '下載 SVG' : '下载 SVG'"><Download /></a>
    </span>
    <SvgModal ref="modal" :asset="meta.vector" :title="label" :filename="`${figureId}.svg`" />
  </span>
</template>
