import type { InjectionKey } from 'vue'

// Ids of this graph's own arrowheads (one <defs> per graph instance).
export const CODE_GRAPH_MARKERS: InjectionKey<{ edge: string; hi: string; guess: string }> = Symbol('code-graph-markers')
