import { defineAsyncComponent } from 'vue'

// Loaded when the «Related logs» tab opens.
export const TraceRelatedLogs = defineAsyncComponent(() => import('./trace-related-logs.vue'))
