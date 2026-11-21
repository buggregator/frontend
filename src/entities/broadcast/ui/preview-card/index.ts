import { defineAsyncComponent } from 'vue'

// Loads with the first broadcast card: its styles stay out of the first-load
// CSS (#6614).
export const PreviewCard = defineAsyncComponent(() => import('./preview-card.vue'))
