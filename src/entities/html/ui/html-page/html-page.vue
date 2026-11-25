<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import {
  CodeSnippet,
  EmailHtmlFrame,
  EmailPreview,
  EmailPreviewDevice,
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
    <div class="html-page">
      <EventTabs
        v-slot="{ tab }"
        :tabs="tabs"
        label="HTML page"
        url-fragment
      >
        <!-- v-show: the frame does not reload on a tab switch. Same sandbox as
             mails: scripts do not run, links open in a new tab. -->
        <EmailPreview
          v-show="tab === 'preview'"
          :device="EmailPreviewDevice.Desktop"
        >
          <EmailHtmlFrame
            class="html-page__frame"
            :html="markup"
            :title="title"
          />
        </EmailPreview>

        <CodeSnippet
          v-show="tab === 'source'"
          language="html"
          :code="markup"
          wrap
        />
      </EventTabs>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.html-page {
  @apply rounded-lg overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.html-page__frame {
  @apply block w-full border-0;
}
</style>
