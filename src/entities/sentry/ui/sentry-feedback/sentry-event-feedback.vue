<script lang="ts" setup>
import { useEventFeedback } from '../../lib/use-sentry-feedback'
import SentryFeedbackItem from './sentry-feedback-item.vue'

// What users wrote about this error (#6604): on top of the error page, since
// it is often the best clue. Nothing is shown when there is none.
type Props = { eventId: string }

const props = defineProps<Props>()

const { items, error } = useEventFeedback(() => props.eventId)
</script>

<template>
  <section
    v-if="items.length > 0 || error"
    class="event-feedback"
    aria-labelledby="event-feedback-title"
    data-test="sentry-event-feedback"
  >
    <h3
      id="event-feedback-title"
      class="event-feedback__title"
    >
      User feedback
      <span
        v-if="items.length > 0"
        class="event-feedback__count"
      >{{ items.length }}</span>
    </h3>

    <p
      v-if="error"
      class="event-feedback__error"
      role="alert"
    >
      Could not load the feedback: {{ error }}
    </p>

    <div class="event-feedback__list">
      <SentryFeedbackItem
        v-for="item in items"
        :key="item.id"
        :item="item"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.event-feedback {
  @apply mb-4 p-3 rounded-lg;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply border border-blue-200 dark:border-blue-500/30;
}

.event-feedback__title {
  @apply flex items-center gap-2 mb-2;
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.event-feedback__count {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded;
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300;
}

.event-feedback__error {
  @apply text-xs text-red-700 dark:text-red-300 mb-2;
}

.event-feedback__list {
  @apply flex flex-col gap-2;
}
</style>
