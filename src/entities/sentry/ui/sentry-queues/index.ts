import { defineAsyncComponent } from 'vue'

// Async: the Queues tab's styles load with it, not on start (#6713).
export const SentryQueueTable = defineAsyncComponent(() => import('./sentry-queue-table.vue'))
export const SentryQueueJob = defineAsyncComponent(() => import('./sentry-queue-job.vue'))
