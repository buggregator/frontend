<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import {
  CodeSnippet,
  EmailHtmlFrame,
  EventDetailLayout,
  EventTabs,
  type TabItem
} from '@/shared/ui'
import { htmlSize, htmlTitle } from '../../lib/html-event'
import type { HtmlPayload } from '../../types'

type Props = {
  event: NormalizedEvent<HtmlPayload>
}

const props = defineProps<Props>()

const title = computed(() => htmlTitle(props.event.payload))
const size = computed(() => htmlSize(props.event.payload))
const markup = computed(() => props.event.payload.html ?? '')

const tabs: TabItem[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'source', label: 'Source' }
]
</script>

<template>
  <EventDetailLayout
    :title="title"
    :subtitle="size"
    :date="event.date"
  >
    <EventTabs
      v-slot="{ tab }"
      :tabs="tabs"
      label="HTML page"
      url-fragment
    >
      <!-- v-show: the page keeps its state on a tab switch. The sender's
           page as it is: its CSS and scripts run in the sandbox (opaque
           origin: no app page, login or storage); the frame takes the page's height, so
           only the app scrolls. -->
      <div
        v-show="tab === 'preview'"
        class="html-page__canvas"
      >
        <EmailHtmlFrame
          class="html-page__frame"
          :html="markup"
          :title="title"
          scripts
          fit
        />
      </div>

      <CodeSnippet
        v-show="tab === 'source'"
        language="html"
        :code="markup"
        wrap
      />
    </EventTabs>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.html-page__canvas {
  // Pages are drawn for a white background, as in mail previews.
  @apply rounded bg-white overflow-hidden;
}

.html-page__frame {
  @apply block w-full border-0;
}
</style>
