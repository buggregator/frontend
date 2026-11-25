import { defineAsyncComponent } from 'vue'

export const HtmlPage = defineAsyncComponent(() => import('./html-page.vue'))
