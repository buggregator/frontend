<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { jobName, SentryQueueJob, useCronClock, useQueueJob } from '@/entities/sentry'
import { RouteName } from '@/shared/types'
import { SkeletonLoader, StatusPanel } from '@/shared/ui'

// One queue job and its attempts (#6713). The id is the message id (or the
// transaction id of a job without one), so a link opens in any project.
const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))

const { job, hasLoaded, error, notFound, reload } = useQueueJob(id)
const now = useCronClock()

useTitle(computed(() => `${job.value ? jobName(job.value.job).short : 'Job'} · Sentry Queues | Buggregator`))
</script>

<template>
  <div class="queue-job-page">
    <StatusPanel
      v-if="notFound"
      title="No such queue job"
      text="This job is not stored: it may have been deleted, or the link is wrong."
      data-test="queue-not-found"
    >
      <RouterLink
        :to="{ name: RouteName.SentryQueues }"
        class="queue-job-page__back"
      >
        Back to Queues
      </RouterLink>
    </StatusPanel>

    <StatusPanel
      v-else-if="error && !job"
      tone="error"
      title="Could not load the queue job"
      :text="error"
      action-label="Try again"
      @action="reload"
    />

    <div
      v-else-if="!hasLoaded || !job"
      class="queue-job-page__loading"
      role="status"
      aria-label="Loading the queue job"
      data-test="queue-job-loading"
    >
      <SkeletonLoader variant="text" />
      <SkeletonLoader variant="text" />
    </div>

    <template v-else>
      <StatusPanel
        v-if="error"
        tone="error"
        compact
        title="Could not refresh"
        :text="error"
        action-label="Try again"
        @action="reload"
      />
      <SentryQueueJob
        :job="job"
        :now="now"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/pages/sentry/ui/sentry-crons-page/crons-page' as cp;

.queue-job-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.queue-job-page__loading {
  padding: 16px;
}

.queue-job-page__back {
  @include cp.focus-ring;
  @apply text-blue-700 dark:text-blue-300;

  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
