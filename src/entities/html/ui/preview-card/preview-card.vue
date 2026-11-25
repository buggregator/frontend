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
// A thumbnail: no scrollbar inside the frame.
const thumb = computed(() => `<style>html,body{overflow:hidden}</style>${markup.value}`)
</script>

<template>
  <PreviewCard :event="event">
    <!-- A picture of the sender's page, no title bar around it. Its CSS
         applies, its scripts do not run here: a page that sends events from
         a script would start a new one with every card. They run on the
         event page. The card is the link; the frame takes no clicks. -->
    <RouterLink
      :to="eventLink"
      class="html-card"
      :class="{ 'html-card--text': !markup }"
      data-test="html-card"
    >
      <span
        v-if="markup"
        class="html-card__thumb"
        aria-hidden="true"
      >
        <EmailHtmlFrame
          class="html-card__frame"
          :html="thumb"
          :title="title"
          tabindex="-1"
          loading="lazy"
        />
      </span>

      <span
        v-if="markup"
        class="html-card__open"
      >Open the page</span>

      <!-- The server left the markup out of the feed (over 32 KB). -->
      <template v-else>
        <span
          v-if="event.payload.text"
          class="html-card__text"
        >{{ event.payload.text }}</span>
        <span
          class="html-card__note"
          data-test="html-card-truncated"
        >Large page: open it to see it</span>
      </template>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.html-card {
  @apply block rounded cursor-pointer;
}

.html-card--text {
  @apply p-3;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.html-card__thumb {
  // Pages are drawn for a white background, as in mail previews.
  @apply block h-64 overflow-hidden rounded bg-white pointer-events-none;
}

.html-card__frame {
  // Beats the 60vh min-height the mail preview sets on every iframe.
  @apply block w-full h-full min-h-0 border-0;
}

.html-card__open {
  @apply block mt-1.5 text-xs font-medium text-blue-600 dark:text-blue-400;
}

.html-card:hover .html-card__open {
  @apply underline;
}

.html-card__text {
  @apply block text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3;
}

.html-card__note {
  @apply block mt-1 text-2xs text-gray-500 dark:text-gray-400;
}
</style>
