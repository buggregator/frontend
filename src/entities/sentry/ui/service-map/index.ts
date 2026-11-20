import { defineAsyncComponent } from 'vue'

// Loaded when the Service map view opens: its styles and code stay out of the first load.
export const ServiceMap = defineAsyncComponent(() => import('./service-map.vue'))
