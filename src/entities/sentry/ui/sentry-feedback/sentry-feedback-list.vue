<script lang="ts" setup>
import type { SentryFeedback } from '../../types'
import SentryFeedbackItem from './sentry-feedback-item.vue'

type Props = {
  items: SentryFeedback[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), { loading: false })
</script>

<template>
  <div
    class="feedback-list"
    data-test="sentry-feedback-list"
  >
    <SentryFeedbackItem
      v-for="item in items"
      :key="item.id"
      :item="item"
      show-error
    />

    <p
      v-if="loading"
      class="feedback-list__status"
    >
      Loading...
    </p>
  </div>
</template>

<style lang="scss" scoped>
.feedback-list {
  @apply flex flex-col gap-2 p-3 sm:p-4 max-w-3xl;
}

.feedback-list__status {
  @apply text-center py-6 text-sm text-gray-500 dark:text-gray-400;
}
</style>
