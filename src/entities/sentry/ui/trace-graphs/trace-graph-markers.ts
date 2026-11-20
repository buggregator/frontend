import type { InjectionKey } from 'vue'

// Arrowhead marker ids of one graph instance (#6531: one marker per state, own ids per graph).
export type TraceGraphMarkers = { edge: string; err: string; hi: string }

export const TRACE_GRAPH_MARKERS: InjectionKey<TraceGraphMarkers> = Symbol('trace-graph-markers')
