<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import { onSentryEvent, SentryEmptyState, SentryFeedbackList, useSentryFeedbackList } from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { StatusPanel } from '@/shared/ui'

useTitle('Sentry Feedback | Buggregator')

// Every piece of user feedback (#6604), also what was sent without an error.
const { items, hasLoaded, error, isInitialLoading, total, page, fetchList } = useSentryFeedbackList()

// The project and the period are mixed into the request; refetch on a change.
const { activeProjectKey, period } = storeToRefs(useEventsStore())

watch([activeProjectKey, period], () => {
  page.value = 1
  hasLoaded.value = false
  fetchList()
})

onMounted(() => {
  fetchList()
})

onSentryEvent(() => {
  fetchList()
}, ['feedback'])
</script>

<template>
  <div class="sentry-feedback-page">
    <StatusPanel
      v-if="error"
      tone="error"
      title="Could not load feedback"
      :text="error"
      action-label="Try again"
      @action="fetchList"
    />

    <SentryEmptyState
      v-else-if="!isInitialLoading && items.length === 0"
      type="feedback"
    />

    <SentryFeedbackList
      v-else
      :items="items"
      :loading="isInitialLoading"
    />

    <div
      v-if="!isInitialLoading && total > 0"
      class="sentry-feedback-page__footer"
    >
      {{ total }} feedback {{ total !== 1 ? 'entries' : 'entry' }}<template v-if="total > items.length">
        , the newest {{ items.length }} shown
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sentry-feedback-page {
  @apply flex flex-col h-full;
}

.sentry-feedback-page__footer {
  @apply text-center py-3 text-xs text-gray-500 dark:text-gray-400;
  @apply border-t border-gray-100 dark:border-gray-800;
}
</style>
