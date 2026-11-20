import { defineAsyncComponent } from 'vue'

// Loaded when their tab opens: flame-chart-js and vue-flow stay out of the first load.
export const TraceFlameGraph = defineAsyncComponent(() => import('./trace-flame-graph.vue'))
export const TraceCallGraph = defineAsyncComponent(() => import('./trace-call-graph.vue'))
export { default as TraceInsight } from './trace-insight.vue'
