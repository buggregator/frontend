import { defineAsyncComponent } from 'vue'

export * from './code-graph-frame-link'
export * from './code-symbol-panel'
export * from './code-search'

// Vue Flow stays out of the first chunk: the graph loads with the Code page.
export const CodeFocusGraph = defineAsyncComponent(() => import('./code-focus-graph/code-focus-graph.vue'))
export const CodeProjectGraph = defineAsyncComponent(() => import('./code-project-graph/code-project-graph.vue'))
