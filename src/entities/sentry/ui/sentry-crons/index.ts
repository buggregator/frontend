import { defineAsyncComponent } from 'vue'

// Async: the Crons tab's styles load with it, not on start (#6617).
export const SentryCronTable = defineAsyncComponent(() => import('./sentry-cron-table.vue'))
export const SentryCronJob = defineAsyncComponent(() => import('./sentry-cron-job.vue'))
