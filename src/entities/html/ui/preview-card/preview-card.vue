<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EmailHtmlFrame, PreviewCard } from '@/shared/ui'
import { htmlSize, htmlTitle } from '../../lib/html-event'
import type { HtmlPayload } from '../../types'

type Props = {
  event: NormalizedEvent<HtmlPayload>
}

const props = defineProps<Props>()

const eventLink = computed(() => `/html/${props.event.id}`)
const title = computed(() => htmlTitle(props.event.payload))
const size = computed(() => htmlSize(props.event.payload))
// A page up to 32 KB is drawn in the card, as in the server's feed preview;
// a bigger one (up to 1 MB) is drawn only on its event page.
const CARD_HTML_MAX = 32 * 1024
const markup = computed(() => {
  const html = props.event.payload.html ?? ''
  return html.length <= CARD_HTML_MAX ? html : ''
})
// A thumbnail: no scrollbar inside the frame.
const thumb = computed(() => (markup.value ? `<style>html,body{overflow:hidden}</style>${markup.value}` : ''))
const tooBig = computed(() => !markup.value && (props.event.payload.truncated || !!props.event.payload.html))
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="eventLink"
      class="html-card"
      data-test="html-card"
    >
      <span class="html-card__head">
        <span class="html-card__title">{{ title }}</span>
        <span
          v-if="size"
          class="html-card__size"
        >{{ size }}</span>
      </span>

      <!-- A picture of the page: the card is the link, so the frame takes no
           clicks and no focus. Same sandbox as mails: no scripts. -->
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

      <template v-else>
        <span
          v-if="event.payload.text"
          class="html-card__text"
        >{{ event.payload.text }}</span>
        <span
          v-if="tooBig"
          class="html-card__note"
          data-test="html-card-truncated"
        >Large page: open it to see the preview</span>
      </template>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.html-card {
  @apply block p-3 rounded cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.html-card__head {
  @apply flex items-center justify-between gap-2 min-w-0;
}

.html-card__title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 truncate;
}

.html-card__size {
  @apply text-2xs font-mono px-1.5 py-0.5 rounded flex-shrink-0;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
}

.html-card__thumb {
  // Pages are drawn for a white background, as in mail previews.
  @apply block mt-2 h-48 overflow-hidden rounded bg-white;
  @apply border border-gray-200 dark:border-gray-700;
  @apply pointer-events-none;
}

.html-card__frame {
  // Beats the 60vh min-height the mail preview sets on every iframe.
  @apply block w-full h-full min-h-0 border-0;
}

.html-card__text {
  @apply block mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3;
}

.html-card__note {
  @apply block mt-1 text-2xs text-gray-500 dark:text-gray-400;
}
</style>
