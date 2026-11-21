import { defineAsyncComponent } from 'vue'

// Async: the card's styles stay out of the first load (CSS budget).
export const PreviewCard = defineAsyncComponent(() => import('./preview-card.vue'))
