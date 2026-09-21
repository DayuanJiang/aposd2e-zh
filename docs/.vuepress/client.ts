import { onMounted } from 'vue'
import { defineClientConfig } from 'vuepress/client'
import ReaderLayout from './reader/ReaderLayout.vue'
import ChapterDiagram from './reader/ChapterDiagram.vue'
import CodeExample from './reader/CodeExample.vue'
import OriginalFigure from './reader/OriginalFigure.vue'
import { provideReader, useReader } from './reader/state'
import './reader/reader.css'

export default defineClientConfig({
  enhance({ app }) {
    provideReader(app)
    app.component('ChapterDiagram', ChapterDiagram)
    app.component('CodeExample', CodeExample)
    app.component('OriginalFigure', OriginalFigure)
  },
  setup() {
    const reader = useReader()
    onMounted(reader.init)
  },
  layouts: { Layout: ReaderLayout },
})
