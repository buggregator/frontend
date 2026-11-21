<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SentryCronJob, useCronClock, useCronJob } from '@/entities/sentry'
import { useEventsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { SkeletonLoader, StatusPanel } from '@/shared/ui'

// One cron job and its runs (#6617). The project comes with the link from
// the table; a bare URL uses the selected project.
const route = useRoute()
const { activeProjectKey } = storeToRefs(useEventsStore())
const slug = computed(() => String(route.params.slug ?? ''))
const project = computed(() => String(route.query.project ?? '') || activeProjectKey.value || 'default')

useTitle(computed(() => `${slug.value} · Sentry Crons | Buggregator`))

const { monitor, checkins, hasLoaded, loadingOlder, hasOlder, error, notFound, reload, loadOlder } = useCronJob(
  slug,
  project
)
const now = useCronClock()
</script>

<template>
  <div class="cron-job-page">
    <StatusPanel
      v-if="notFound"
      title="No such cron job"
      :text="`«${slug}» is not a cron job of the project «${project}». It may have been deleted, or it is in another project.`"
      data-test="cron-not-found"
    >
      <RouterLink
        :to="{ name: RouteName.SentryCrons }"
        class="cron-job-page__back"
      >
        Back to Crons
      </RouterLink>
    </StatusPanel>

    <StatusPanel
      v-else-if="error && !monitor"
      tone="error"
      title="Could not load the cron job"
      :text="error"
      action-label="Try again"
      @action="reload"
    />

    <div
      v-else-if="!hasLoaded || !monitor"
      class="cron-job-page__loading"
      role="status"
      aria-label="Loading the cron job"
      data-test="cron-job-loading"
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
      <SentryCronJob
        :monitor="monitor"
        :checkins="checkins"
        :now="now"
        :has-older="hasOlder"
        :loading-older="loadingOlder"
        @load-older="loadOlder"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use 'src/pages/sentry/ui/sentry-crons-page/crons-page' as cp;

.cron-job-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cron-job-page__loading {
  padding: 16px;
}

.cron-job-page__back {
  @include cp.focus-ring;
  @apply text-blue-700 dark:text-blue-300;

  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
