<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout, EventDetailSection } from '@/shared/ui'
import type { Sentry } from '../../types'
import { SentryException } from '../sentry-exception'
import { SentryPageApp } from '../sentry-page-app'
import { SentryPageBreadcrumbs } from '../sentry-page-breadcrumbs'
import { SentryPageDevice } from '../sentry-page-device'
import { SentryPageExtra } from '../sentry-page-extra'
import { SentryPageRequest } from '../sentry-page-request'
import { SentryPageTags } from '../sentry-page-tags'

type Props = {
  event: NormalizedEvent<Sentry>
}

const props = defineProps<Props>()

const formattedTimestamp = computed(() => moment(props.event.payload.timestamp).toLocaleString())

const mainException = computed(() => props.event.payload?.exception?.values?.[0])

const exceptionsLength = computed(() => props.event?.payload?.exception?.values?.length || 0)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div
        v-if="mainException"
        class="sentry-header"
      >
        <h2 class="sentry-header__type">
          {{ mainException.type }}
        </h2>
        <pre class="sentry-header__message">{{ mainException.value }}</pre>
        <span class="sentry-header__date">{{ formattedTimestamp }}</span>
      </div>
    </template>

    <EventDetailSection>
      <SentryPageTags :payload="event.payload" />
    </EventDetailSection>

    <EventDetailSection
      v-if="mainException"
      title="Exceptions"
      :count="exceptionsLength"
    >
      <div class="sentry-exceptions">
        <template
          v-if="
            event.payload.exception &&
              event.payload.exception.values &&
              event.payload.exception.values.length > 0
          "
        >
          <SentryException
            v-for="e in event.payload.exception.values"
            :key="`exception-${e.value}-${e.type}`"
            :exception="e"
            :max-frames="10"
          />
        </template>
      </div>
    </EventDetailSection>

    <EventDetailSection
      v-if="
        event.payload.breadcrumbs &&
          event.payload.breadcrumbs.values &&
          event.payload.breadcrumbs.values.length > 0
      "
    >
      <SentryPageBreadcrumbs :breadcrumbs="event.payload.breadcrumbs.values" />
    </EventDetailSection>

    <EventDetailSection v-if="event.payload.request">
      <SentryPageRequest :request="event.payload.request" />
    </EventDetailSection>

    <EventDetailSection v-if="event.payload.contexts && event.payload.contexts.app">
      <SentryPageApp :app="event.payload.contexts.app" />
    </EventDetailSection>

    <EventDetailSection v-if="event.payload.contexts && event.payload.contexts.device">
      <SentryPageDevice :device="event.payload.contexts.device" />
    </EventDetailSection>

    <EventDetailSection v-if="event.payload.extra">
      <SentryPageExtra :extra="event.payload.extra" />
    </EventDetailSection>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.sentry-header__type {
  @apply font-bold text-base md:text-lg lg:text-xl break-all sm:break-normal mb-3;
}

.sentry-header__message {
  @apply text-xs break-words whitespace-pre-wrap;
  @apply p-2.5 rounded font-mono;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
}

.sentry-header__date {
  @apply text-xs font-mono text-gray-500 dark:text-gray-400 mt-3 block;
}

.sentry-exceptions {
  @apply flex flex-col gap-3;
}
</style>
