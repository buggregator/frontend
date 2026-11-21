import { defineAsyncComponent } from 'vue'

// Async: their styles load with the error page and the Feedback tab, not on start.
export const SentryEventFeedback = defineAsyncComponent(() => import('./sentry-event-feedback.vue'))
export const SentryFeedbackList = defineAsyncComponent(() => import('./sentry-feedback-list.vue'))
