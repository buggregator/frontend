import { defineAsyncComponent } from 'vue'

// Async: markdown-it loads with the first answer that needs it, not on start.
export const MdText = defineAsyncComponent(() => import('./md-text.vue'))
