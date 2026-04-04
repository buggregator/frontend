<script lang="ts" setup>
import { toRef } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { CodeSnippet, EventDetailLayout, EventDetailSection, PageTabs, PageTab } from '@/shared/ui'
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
</script>

<template>
  <EventDetailLayout :date="event.date">
    <template #header>
      <HttpDumpHeader :event="event" />
    </template>

    <div class="http-dump-tabs">
      <PageTabs :use-url-fragment="useUrlFragment">
        <!-- Proxy: RESPONSE tab first (default) -->
        <PageTab
          v-if="hasResponse"
          name="Response"
        >
          <div class="http-dump-tabs__panel">
            <HttpResponsePanel :event="event" />
          </div>
        </PageTab>

        <PageTab name="Request">
          <div class="http-dump-tabs__panel">
            <HttpRequestPanel :event="event" />
          </div>
        </PageTab>

        <PageTab name="Raw">
          <div class="http-dump-tabs__panel">
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
          </div>
        </PageTab>
      </PageTabs>
    </div>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
/* Pull tabs to the edges — counteract the parent body padding */
.http-dump-tabs {
  @apply -mx-5 md:-mx-6 lg:-mx-8 -mb-5 -mt-1;
  @apply flex-grow flex flex-col;

  /* Override tabs h-full so background extends with content */
  :deep(.tabs-component) {
    @apply h-auto flex-grow;
  }

  /* Add left padding to tab bar to align with content */
  :deep(.tabs-component-tabs) {
    @apply px-5 md:px-6 lg:px-8;
  }
}

/* Restore padding inside each tab panel */
.http-dump-tabs__panel {
  @apply py-5 px-5 md:px-6 lg:px-8 flex flex-col gap-6;
}
</style>
