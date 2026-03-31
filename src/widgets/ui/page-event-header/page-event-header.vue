<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { REST_API_URL } from '@/shared/lib/io'
import { useEvents } from '@/shared/lib/use-events'
import { RouteName, type Uuid } from '@/shared/types'
import { AppHeader, IconSvg } from '@/shared/ui'

type Props = {
  title: string
  eventId: Uuid
}

const props = defineProps<Props>()

const { events } = useEvents()
const router = useRouter()

const eventsListLink = computed(() => {
  const path = router.currentRoute.value.path
  // For /sentry/event/:id, link back to /sentry/exceptions
  if (path.startsWith('/sentry/event/')) {
    return '/sentry/exceptions'
  }
  return path.replace(`/${props.eventId}`, '')
})
const onDelete = () => {
  events.removeById(props.eventId)
  router.push({ name: RouteName.Home })
}

const eventUrl = computed(() => `${REST_API_URL}/api/event/${props.eventId}`)
</script>

<template>
  <AppHeader>
    <RouterLink
      :to="{ name: RouteName.Home }"
      class="nav__crumb"
    >
      Home
    </RouterLink>

    <span class="nav__sep">/</span>

    <RouterLink
      :to="eventsListLink"
      class="nav__crumb"
    >
      {{ title }}
    </RouterLink>

    <span class="nav__sep">/</span>

    <span
      class="nav__id"
      :title="eventId"
    >
      {{ eventId.substring(0, 8) }}
    </span>

    <template #controls>
      <a
        v-if="eventUrl"
        :href="eventUrl"
        target="_blank"
        class="action-btn"
        title="Open JSON payload"
        aria-label="Open JSON payload"
      >
        <IconSvg
          name="file-download"
          class="action-btn__icon"
        />
        <span class="action-btn__text">JSON</span>
      </a>

      <button
        class="action-btn action-btn--danger"
        title="Delete event"
        aria-label="Delete event"
        @click="onDelete"
      >
        <IconSvg
          name="trash-bin"
          class="action-btn__icon"
        />
        <span class="action-btn__text">Delete</span>
      </button>
    </template>
  </AppHeader>
</template>

<style lang="scss" scoped>
/* Breadcrumbs */
.nav__crumb {
  @apply text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors;
}

.nav__sep {
  @apply text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.nav__id {
  @apply text-sm font-mono text-gray-400 dark:text-gray-600;
}

/* Action buttons */
.action-btn {
  @apply h-7 flex items-center gap-1.5 px-2.5 rounded;
  @apply text-xs font-medium;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-700;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply transition-colors cursor-pointer;
}

.action-btn--danger {
  @apply hover:text-red-600 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
}

.action-btn__icon {
  @apply w-3.5 h-3.5;
}

.action-btn__text {
  @apply hidden sm:inline;
}
</style>
