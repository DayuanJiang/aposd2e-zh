import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { createSidebar } from './sidebar'
import { readerPlugin } from './reader/plugin'

const base = '/aposd2e-zh/'
const favicon = { rel: 'icon', type: 'image/png', href: `${base}favicon.png` }
const site = 'https://dayuanjiang.github.io/aposd2e-zh/'
const description = '《软件设计的哲学（第二版）》中文版：对照原文修订的译文，每章配有译者图解、章首概览与章末回顾，代码示例可切换为 Python，支持简体与繁体。'

export default defineUserConfig({
  bundler: viteBundler({
    viteOptions: {
      plugins: [{
        name: 'aposd-dev-favicon',
        apply: 'serve',
        transformIndexHtml: () => [{ tag: 'link', attrs: favicon, injectTo: 'head-prepend' }],
      }],
    },
  }),

  base,
  head: [
    ['link', favicon],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: '软件设计的哲学' }],
    ['meta', { property: 'og:title', content: '软件设计的哲学（第二版）中文版' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: site }],
    ['meta', { property: 'og:image', content: `${site}cover.jpeg` }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: '软件设计的哲学（第二版）中文版' }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: `${site}cover.jpeg` }],
  ],
  plugins: [readerPlugin()],

  locales: {
    '/': {
      lang: 'zh-CN',
      title: "软件设计的哲学，第二版",
      description,
    },
    '/en/': {
      lang: 'en-US',
      title: 'A Philosophy of Software Design, 2nd Edition',
      description: 'Chinese translation of A Philosophy of Software Design, 2nd Edition, with chapter diagrams, opening maps, closing recaps and Python companions for the code examples.',
    },
    '/zh-tw/' : {
      lang: 'zh-TW',
      title: '軟體設計的哲學，第二版',
      description: '《軟體設計的哲學（第二版）》中文版：對照原文修訂的譯文，每章配有譯者圖解、章首概覽與章末回顧，程式碼範例可切換為 Python，支援簡體與繁體。',
    }
  },

  theme: defaultTheme({
    colorMode: 'light',
    colorModeSwitch: false,
    repo: "DayuanJiang/aposd2e-zh",
    docsRepo: "DayuanJiang/aposd2e-zh",
    docsBranch: "main",
    docsDir: "docs",
    contributors: false,
    sidebarDepth: 2,
    locales: {
      '/': { // zh-CN
        selectLanguageName: '简体中文',
        selectLanguageText: '选择语言',
        // selectLanguageAriaselectLanguageName: '选择语言',
        editLink: true,
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdatedText: '上次更新',
        sidebar: createSidebar('docs', ''),
      },
      '/en/': {
        selectLanguageName: 'English',
        selectLanguageText: 'Languages',
        // selectLanguageAriaselectLanguageName: 'Select language',
        editLink: false,
        editLinkText: 'Edit this page on GitHub',
        lastUpdatedText: 'Last Updated',
        sidebar: createSidebar('docs/en', '/en'),
      },
      '/zh-tw/': {
        selectLanguageName: '繁体中文',
        selectLanguageText: '選擇語言',
        // selectLanguageAriaselectLanguageName: '選擇語言',
        editLink: false,
        editLinkText: '在 GitHub 上編輯此頁',
        lastUpdatedText: '上次更新',
        sidebar: createSidebar('docs/zh-tw', '/zh-tw'),
      }
    }
  }),
})
