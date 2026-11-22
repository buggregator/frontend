// A filter chip of the bar. A page's own filters (the level of Sentry
// exceptions, the source of traces) come in as chips too: `extra` of the bar.
export type BarChip = {
  id: string
  name: string
  value: string
  not?: boolean
}
