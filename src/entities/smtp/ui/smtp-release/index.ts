import { defineAsyncComponent } from 'vue'

// Async: the dialog and its styles load with the email page and Settings, not on start.
export const SmtpRelease = defineAsyncComponent(() => import('./smtp-release.vue'))
export const SmtpRelayStatus = defineAsyncComponent(() => import('./smtp-relay-status.vue'))
