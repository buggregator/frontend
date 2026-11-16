// Fonts ship with the app: opening the UI contacts no outside host.
import '@fontsource-variable/dm-sans/opsz.css'
import '@fontsource-variable/dm-sans/opsz-italic.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './assets/index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import {createAppRouter} from "@/app/router";
import { App } from '@/app/ui'

declare global {
  interface Window { Sfdump: (id: string) => void; }
}

const app = createApp(App)

app.use(createPinia())
app.use(createAppRouter())

app.mount('#app')
