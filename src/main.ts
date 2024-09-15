import './assets/index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import {createAppRouter} from "@/app/router";
import { App } from '@/app/ui'
import { SfdumpWrap } from '@/shared/lib/vendor/dumper'

declare global {
  interface Window { Sfdump: (id: string) => void; }
}

window.Sfdump = SfdumpWrap(window.document)

const app = createApp(App)

app.use(createPinia())
app.use(createAppRouter())

app.mount('#app')
