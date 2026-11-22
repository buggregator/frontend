<script lang="ts" setup>
import { computed, toRef } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { CodeSnippet, EventDetailLayout, EventDetailSection, EventTabs, type TabItem } from '@/shared/ui'
import { useHttpDumpEvent } from '../../lib'
import type { HttpDump } from '../../types'
import { HttpDumpHeader } from '../http-dump-header'
import { HttpRequestPanel } from '../http-request-panel'
import { HttpResponsePanel } from '../http-response-panel'

type Props = {
  event: NormalizedEvent<HttpDump>
  useUrlFragment?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  useUrlFragment: true
})

const { hasResponse, curlCommand, rawHttp } = useHttpDumpEvent(toRef(props, 'event'))

// A proxied request opens on its response.
const tabs = computed<TabItem[]>(() => [
  ...(hasResponse.value ? [{ id: 'response', label: 'Response' }] : []),
  { id: 'request', label: 'Request' },
  { id: 'raw', label: 'Raw' }
])
</script>

<template>
  <EventDetailLayout :date="event.date">
    <template #header>
      <HttpDumpHeader :event="event" />
    </template>

    <EventTabs
      v-slot="{ tab }"
      :tabs="tabs"
      :url-fragment="useUrlFragment"
      class="http-dump-tabs"
    >
      <div class="http-dump-tabs__panel">
        <HttpResponsePanel
          v-if="tab === 'response'"
          :event="event"
        />

        <HttpRequestPanel
          v-else-if="tab === 'request'"
          :event="event"
        />

        <template v-else>
          <EventDetailSection title="cURL">
            <CodeSnippet
              language="bash"
              :code="curlCommand"
            />
          </EventDetailSection>

          <EventDetailSection title="Raw HTTP">
            <CodeSnippet
              language="plaintext"
              :code="rawHttp"
            />
          </EventDetailSection>
        </template>
      </div>
    </EventTabs>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* The panel reaches the edges — counteract the parent body padding */
.http-dump-tabs {
  @apply -mx-5 md:-mx-6 lg:-mx-8 -mb-5 -mt-1;
  @apply flex-grow flex flex-col;
}

/* Restore padding inside each tab panel */
.http-dump-tabs__panel {
  @apply py-5 px-5 md:px-6 lg:px-8 flex flex-col gap-6;
}
</style>
