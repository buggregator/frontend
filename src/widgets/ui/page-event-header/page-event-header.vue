<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { copyTextToClipboard } from '@/shared/lib/clipboard'
import { REST_API_URL } from '@/shared/lib/io'
import { useEvents } from '@/shared/lib/use-events'
import { RouteName, type Uuid } from '@/shared/types'
import { AppHeader, IconSvg } from '@/shared/ui'

type Props = {
  title: string
  eventId: Uuid
  // Row 2 for the event's tabs, which the event page puts there (EventTabs).
  tabs?: boolean
}

const props = withDefaults(defineProps<Props>(), { tabs: false })

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
const onDelete = async () => {
  if (!window.confirm('Delete this event? This cannot be undone.')) {
    return
  }

  // Stay on the event when the server refused: it still exists.
  if (await events.removeById(props.eventId)) {
    router.push(eventsListLink.value)
  }
}

const eventUrl = computed(() => `${REST_API_URL}/api/event/${props.eventId}`)

// The address of this event for a teammate. With sign-in on, opening it while
// signed out goes through the login page and comes back here (return_to).
const isLinkCopied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
const copyLink = async () => {
  const link = new URL(router.resolve(router.currentRoute.value.fullPath).href, window.location.origin).toString()
  try {
    await copyTextToClipboard(link)
  } catch (e) {
    console.error(e)
    return
  }
  isLinkCopied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (isLinkCopied.value = false), 2000)
}
onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <AppHeader>
    <RouterLink
      :to="{ name: RouteName.Home }"
      class="nav__crumb"
    >
      Home
    </RouterLink>

    <span
      class="nav__sep"
      aria-hidden="true"
    >/</span>

    <RouterLink
      :to="eventsListLink"
      class="nav__crumb"
    >
      {{ title }}
    </RouterLink>

    <span
      class="nav__sep"
      aria-hidden="true"
    >/</span>

    <span
      class="nav__id"
      :title="eventId"
    >
      {{ eventId.substring(0, 8) }}
    </span>

    <template #controls>
      <button
        class="action-btn"
        title="Copy link to this event"
        aria-label="Copy link to this event"
        @click="copyLink"
      >
        <IconSvg
          name="copy"
          class="action-btn__icon"
        />
        <span class="action-btn__text">{{ isLinkCopied ? 'Copied' : 'Link' }}</span>
      </button>
      <span
        role="status"
        class="sr-only"
      >{{ isLinkCopied ? 'Link copied' : '' }}</span>

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

    <template
      v-if="tabs"
      #toolbar
    />
  </AppHeader>
</template>

<style lang="scss" scoped>
.nav__id {
  @apply text-sm font-mono text-gray-500 dark:text-gray-400;
}
</style>
