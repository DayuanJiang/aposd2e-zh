<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePageLang } from 'vuepress/client'
import { useReader } from './state'

const props = defineProps<{
  exampleId: string
  note: string
  noteEn: string
  noteTw: string
  originalLanguage: string
}>()
const { preferences } = useReader()
const lang = usePageLang()
const local = ref<string | null>(null)
const mode = computed(() => local.value || preferences.code)
const english = computed(() => lang.value.startsWith('en'))
const originalLabel = computed(() => ({ java: 'Java', cpp: 'C++', c: 'C', go: 'Go' }[props.originalLanguage] || props.originalLanguage))
const noteText = computed(() => english.value ? props.noteEn : lang.value === 'zh-TW' ? props.noteTw : props.note)
watch(() => preferences.code, () => { local.value = null })
</script>

<template>
  <section class="code-example" :data-example="exampleId" :data-code-mode="mode">
    <div class="code-example-toolbar">
      <span class="code-example-label">{{ mode === 'python' ? (english ? 'Python · teaching adaptation' : lang === 'zh-TW' ? 'Python · 教學改寫' : 'Python · 教学改写') : originalLabel }}</span>
      <div class="reader-segments" role="group" :aria-label="english ? 'Example language' : lang === 'zh-TW' ? '範例語言' : '示例语言'">
        <button type="button" :aria-pressed="mode === 'original'" @click="local = 'original'">{{ english ? 'Original' : '原例' }}</button>
        <button type="button" :aria-pressed="mode === 'python'" @click="local = 'python'">Python</button>
      </div>
    </div>
    <div v-show="mode === 'original'" class="code-example-original"><slot name="original" /></div>
    <div v-show="mode === 'python'" class="code-example-python"><slot name="python" /></div>
    <p v-if="mode === 'python'" class="code-example-note">{{ noteText }}</p>
  </section>
</template>
