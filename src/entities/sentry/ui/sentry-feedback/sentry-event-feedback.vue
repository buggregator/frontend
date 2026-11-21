<script lang="ts" setup>
import { EventDetailSection } from '@/shared/ui'
import { useEventFeedback } from '../../lib/use-sentry-feedback'
import SentryFeedbackItem from './sentry-feedback-item.vue'

// What users wrote about this error (#6604): on top of the error page, since
// it is often the best clue. Nothing is shown when there is none.
type Props = { eventId: string }

const props = defineProps<Props>()

const { items, error } = useEventFeedback(() => props.eventId)
</script>

<template>
  <EventDetailSection
    v-if="items.length > 0 || error"
    title="User feedback"
    :count="items.length"
    class="event-feedback"
    data-test="sentry-event-feedback"
  >
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
  </EventDetailSection>
</template>

<style lang="scss" scoped>
// The blue callout: feedback is often the best clue, so it stands out.
.event-feedback {
  @apply mb-4 p-3 rounded-lg;
  @apply bg-blue-50 dark:bg-blue-500/10;
  @apply border border-blue-200 dark:border-blue-500/30;
}

.event-feedback__error {
  @apply text-xs text-red-700 dark:text-red-300 mb-2;
}

.event-feedback__list {
  @apply flex flex-col gap-2;
}
</style>
