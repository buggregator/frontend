import { defineAsyncComponent } from 'vue'

// Async: the concept is not part of the first load.
export const SentryExplain = defineAsyncComponent(() => import('./sentry-explain.vue'))
