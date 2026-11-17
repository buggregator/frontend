import { defineAsyncComponent } from 'vue'

// Setup help loads on demand, the header button too: the first load stays
// within its budget (#5941).
export const SetupGuide = defineAsyncComponent(() => import('./setup-guide.vue'))
export const SetupHelpButton = defineAsyncComponent(() => import('./setup-help-button.vue'))
export { SETUP_SECTION_IDS, hasSetupHelp } from './sections'
export const SetupHelpPanel = defineAsyncComponent(() => import('./setup-help-panel.vue'))
export { fillText } from './fill'
export { useSetupValues } from './use-setup-values'
