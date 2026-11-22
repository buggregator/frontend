import { defineAsyncComponent } from 'vue'

// Lazy: a pause is rare, so its buttons and styles stay out of the first load.
export const RayLock = defineAsyncComponent(() => import('./ray-lock.vue'))
