import './assets/index.css'

import 'highlight.js/lib/common'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createAppRouter } from '@/app/router'
import { App } from '@/app/ui'

declare global {
  interface Window {
    Sfdump: (id: string) => void
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(createAppRouter())

app.mount('#app')
