<script lang="ts" setup generic="T">
import download from 'downloadjs'
import { toBlob, toPng } from 'html-to-image'
import { ref, computed, onBeforeMount, onMounted } from 'vue'
import { REST_API_URL } from '../../lib/io'
import { logger } from '../../lib/logger'
import { useEvents } from '../../lib/use-events'
import { screenshotingEventId } from '../../lib/use-keyboard-nav'
import type { NormalizedEvent } from '../../types'
import PreviewCardFooter from './preview-card-footer.vue'
import PreviewCardHeader from './preview-card-header.vue'
import { DownloadType } from './types'

type Props = {
  event: NormalizedEvent<T>
}

const props = defineProps<Props>()

const isCollapsed = ref(false)
const isOptimized = ref(false)
const isVisibleControlsLocal = ref(true)
const isVisibleControls = computed(() =>
  isVisibleControlsLocal.value && screenshotingEventId.value !== props.event.id
)

const eventRef = ref(null)
const isDeleting = ref(false)
const isInit = ref(true)
const { events, lockedIds } = useEvents()

const isLocked = computed(() => (lockedIds?.items.value || []).includes(props.event.id))

const normalizedOrigin = computed(() => {
  const originEntriesList = Object.entries(props.event.origin || {})
    .map(([key, value]) => [key, String(value)])
    .filter(([_, value]) => Boolean(value))

  return originEntriesList.length > 0 ? Object.fromEntries(originEntriesList) : null
})

const eventUrl = computed(() => `${REST_API_URL}/api/event/${props.event.id}`)

const toggleView = () => {
  isCollapsed.value = !isCollapsed.value
}

const changeVisibleControls = (value = true) => {
  isVisibleControlsLocal.value = value
}

const deleteEvent = () => {
  isDeleting.value = true

  setTimeout(() => {
    events?.removeById(props.event.id)
  }, 350)
}

const toggleEventLock = () => {
  if (isLocked.value) {
    lockedIds?.remove(props.event.id)
  } else {
    lockedIds?.add(props.event.id)
  }
}

const downloadImage = () => {
  changeVisibleControls(false)

  if (eventRef.value) {
    toPng(eventRef.value as HTMLInputElement)
      .then((dataUrl) => {
        download(dataUrl, `${props.event.type}-${props.event.id}.png`)
      })
      .catch((e) => logger.ui.error('Operation failed', e))
      .finally(() => {
        changeVisibleControls(true)
      })
  }
}

const downloadFile = async () => {
  try {
    const event = await events?.getItem(props.event.id)

    if (event) {
      download(
        JSON.stringify(event, null, 2),
        `${props.event.type}-${props.event.id}.json`,
        'application/json'
      )
    }
  } catch (e) {
    logger.ui.error('Failed to download event JSON', e)
  }
}

const downloadEvent = (type: DownloadType) => {
  if (type === DownloadType.Image) {
    downloadImage()
  } else {
    downloadFile()
  }
}

const copyCode = () => {
  changeVisibleControls(false)

  if (eventRef.value) {
    // TODO: fix console error on copy
    toBlob(eventRef.value as HTMLElement)
      .then((blob) => {
        if (blob) {
          navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        }
      })
      .catch((e) => logger.ui.error('Operation failed', e))
      .finally(() => {
        changeVisibleControls(true)
      })
  }
}

onBeforeMount(() => {
  isInit.value = false
})

onMounted(() => {
  setTimeout(() => {
    isInit.value = true
  }, 200)
})
</script>

<template>
  <div
    :id="event.id"
    ref="eventRef"
    class="preview-card"
    :class="[
      `preview-card--type-${event.type}`,
      {
        'preview-card--initialized': isInit && !isDeleting,
        'preview-card--deleting': isDeleting
      }
    ]"
  >
    <div class="preview-card__in">
      <PreviewCardHeader
        class="preview-card__header"
        :event-url="eventUrl"
        :event-type="event.type"
        :event-id="event.id"
        :labels="event.labels"
        :event-date="event.date"
        :is-open="!isCollapsed && !isOptimized"
        :is-locked="isLocked"
        :is-visible-controls="isVisibleControls && !isOptimized"
        @toggle-view="toggleView"
        @delete="deleteEvent"
        @copy="copyCode"
        @download="downloadEvent"
        @lock="toggleEventLock"
        @dblclick="toggleView"
      />

      <div
        v-if="!isCollapsed && !isOptimized"
        ref="event_body"
        class="preview-card__body"
      >
        <slot />
      </div>

      <PreviewCardFooter
        v-if="!isCollapsed && !isOptimized && (normalizedOrigin || event.serverName)"
        class="preview-card__footer"
        :server-name="event.serverName"
        :origin-config="normalizedOrigin"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Event type color map for left stripe
   Tailwind safelist comment for JIT:
   'border-l-rose-500' 'border-l-violet-500' 'border-l-amber-500'
   'border-l-green-500' 'border-l-yellow-500' 'border-l-orange-500'
   'border-l-teal-500' 'border-l-cyan-500' */
$typeStripeMap: (
  'sentry': 'rose',
  'profiler': 'violet',
  'smtp': 'amber',
  'http-dump': 'green',
  'inspector': 'yellow',
  'var-dump': 'orange',
  'monolog': 'teal',
  'ray': 'cyan'
);

.preview-card {
  display: grid;
  grid-template-rows: 0fr;
  transition:
    grid-template-rows 0.2s ease-in-out,
    opacity 0.2s ease;
}

.preview-card--initialized {
  grid-template-rows: 1fr;
}

.preview-card--deleting {
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.3s ease-in-out,
    opacity 0.3s ease;
}

.preview-card__in {
  @apply flex flex-grow flex-col px-3 py-2.5 lg:px-4 lg:py-3 opacity-100 overflow-hidden;
  @apply bg-white dark:bg-gray-800;
  @apply border-l-[3px] border-l-gray-300 dark:border-l-gray-600;
  @apply transition-all duration-100;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }

  .preview-card:not(.preview-card--initialized) & {
    @apply p-0 opacity-0;
  }
}

@each $type, $color in $typeStripeMap {
  .preview-card--type-#{$type} .preview-card__in {
    @apply border-l-#{$color}-500;
  }
}

.preview-card__header {
  @apply w-full;
}

.preview-card__body {
  @apply flex flex-col mt-2 lg:mt-2.5;
}

.preview-card__footer {
  @apply w-full mt-2 lg:mt-2.5;
}
</style>
