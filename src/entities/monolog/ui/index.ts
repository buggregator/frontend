import { defineAsyncComponent } from 'vue'

export * from './preview-card';
export * from './monolog-page';
export * from './monolog-level';

// Only the Logs page shows it: loaded with that page, its styles stay out of
// the feed's first load.
export const MonologLogRow = defineAsyncComponent(() => import('./monolog-log-row/monolog-log-row.vue'))
