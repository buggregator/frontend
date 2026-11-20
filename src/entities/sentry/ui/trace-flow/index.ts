import { defineAsyncComponent } from 'vue'

// Loaded when the Flow view opens.
export const TraceFlow = defineAsyncComponent(() => import('./trace-flow.vue'))
