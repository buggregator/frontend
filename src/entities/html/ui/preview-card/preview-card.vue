<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EmailHtmlFrame, PreviewCard } from '@/shared/ui'
import { htmlTitle } from '../../lib/html-event'
import type { HtmlPayload } from '../../types'

type Props = {
  event: NormalizedEvent<HtmlPayload>
}

const props = defineProps<Props>()

const eventLink = computed(() => `/html/${props.event.id}`)
const title = computed(() => htmlTitle(props.event.payload))
const markup = computed(() => props.event.payload.html ?? '')
</script>

<template>
  <PreviewCard :event="event">
    <!-- The sender's page as it is: no title bar around it, its own CSS and
         scripts run in the sandbox (opaque origin, no app access). The card
         header opens the event. -->
    <div
      v-if="markup"
      class="html-card"
      data-test="html-card"
    >
      <EmailHtmlFrame
        class="html-card__frame"
        :html="markup"
        :title="title"
        scripts
        fit
      />
    </div>

    <!-- The server left the markup out of the feed (over 32 KB). -->
    <RouterLink
      v-else
      :to="eventLink"
      class="html-card html-card--text"
      data-test="html-card"
    >
      <span
        v-if="event.payload.text"
        class="html-card__text"
      >{{ event.payload.text }}</span>
      <span
        class="html-card__note"
        data-test="html-card-truncated"
      >Large page: open it to see it</span>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.html-card {
  // Pages are drawn for a white background, as in mail previews. A very long
  // page scrolls here, in the card; the frame itself never scrolls.
  @apply block rounded overflow-y-auto max-h-[36rem] bg-white;
}

.html-card--text {
  @apply p-3 cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.html-card__frame {
  @apply block w-full border-0;
}

.html-card__text {
  @apply block text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3;
}

.html-card__note {
  @apply block mt-1 text-2xs text-gray-500 dark:text-gray-400;
}
</style>
