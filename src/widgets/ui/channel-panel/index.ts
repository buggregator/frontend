import { defineAsyncComponent } from 'vue'

// The panel loads on demand: only an empty Home needs it (#6012).
export const ChannelPanel = defineAsyncComponent(() => import('./channel-panel.vue'))
export { useEmptyHome } from './use-empty-home'
