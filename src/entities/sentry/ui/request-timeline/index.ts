import { defineAsyncComponent } from 'vue'

// Loaded with its view: keeps the lanes' styles out of the first load.
export const RequestTimeline = defineAsyncComponent(() => import('./request-timeline.vue'))
