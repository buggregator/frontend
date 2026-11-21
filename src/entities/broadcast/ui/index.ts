import { defineAsyncComponent } from 'vue'

export * from './preview-card'
// The console's parts load with its page.
export const BroadcastChannelList = defineAsyncComponent(() =>
  import('./broadcast-channel-list').then((m) => m.BroadcastChannelList)
)
export const BroadcastEventRow = defineAsyncComponent(() =>
  import('./broadcast-event-row').then((m) => m.BroadcastEventRow)
)
export const BroadcastEventDetail = defineAsyncComponent(() =>
  import('./broadcast-event-detail').then((m) => m.BroadcastEventDetail)
)
