<script lang="ts" setup>
import moment from 'moment'
import { Tab, Tabs } from 'vue3-tabs-component'
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout } from '@/shared/ui'
import type { Sentry } from '../../types'
import { SentryException } from '../sentry-exception'
import { SentryPageApp } from '../sentry-page-app'
import { SentryPageBreadcrumbs } from '../sentry-page-breadcrumbs'
import { SentryPageDevice } from '../sentry-page-device'
import { SentryPageExtra } from '../sentry-page-extra'
import { SentryPageModules } from '../sentry-page-modules'
import { SentryPageRequest } from '../sentry-page-request'
import { SentryPageSdk } from '../sentry-page-sdk'
import { SentryPageTags } from '../sentry-page-tags'
import { SentryPageTrace } from '../sentry-page-trace'

type Props = {
  event: NormalizedEvent<Sentry>
}

const props = defineProps<Props>()

const formattedTimestamp = computed(() => moment(props.event.payload.timestamp).toLocaleString())

const mainException = computed(() => props.event.payload?.exception?.values?.[0])
const exceptionsLength = computed(() => props.event?.payload?.exception?.values?.length || 0)

// Header helpers
const platform = computed(() => props.event.payload.platform || 'unknown')
const level = computed(() => props.event.payload.level || 'error')
const transaction = computed(() => props.event.payload.transaction)
const release = computed(() => props.event.payload.release)
const isMessageEvent = computed(() => !mainException.value && props.event.payload.message)

const isHandled = computed(() => {
  if (!mainException.value?.mechanism) return undefined
  return mainException.value.mechanism.handled
})

// Tab visibility
const hasException = computed(() =>
  props.event.payload.exception?.values && props.event.payload.exception.values.length > 0
)
const hasBreadcrumbs = computed(() =>
  props.event.payload.breadcrumbs?.values && props.event.payload.breadcrumbs.values.length > 0
)
const hasRequest = computed(() => !!props.event.payload.request)
const hasModules = computed(() =>
  props.event.payload.modules && Object.keys(props.event.payload.modules).length > 0
)
const hasExtra = computed(() => !!props.event.payload.extra)
const hasTraceContext = computed(() => !!props.event.payload.contexts?.trace)
const hasAppContext = computed(() => !!props.event.payload.contexts?.app)
const hasDeviceContext = computed(() => !!props.event.payload.contexts?.device)
const hasContextTab = computed(() =>
  hasTraceContext.value || hasAppContext.value || hasDeviceContext.value ||
  props.event.payload.contexts?.runtime || props.event.payload.contexts?.os
)
const hasSdk = computed(() => !!props.event.payload.sdk)
</script>

<template>
  <EventDetailLayout>
    <template #header>
      <div class="sentry-header">
        <!-- Badges row -->
        <div class="sentry-header__badges">
          <span
            class="sentry-header__badge sentry-header__badge--level"
            :class="`sentry-header__badge--${level}`"
          >{{ level }}</span>

          <span class="sentry-header__badge sentry-header__badge--platform">
            {{ platform }}
          </span>

          <span
            v-if="isHandled !== undefined"
            class="sentry-header__badge"
            :class="isHandled ? 'sentry-header__badge--handled' : 'sentry-header__badge--unhandled'"
          >
            {{ isHandled ? 'Handled' : 'Unhandled' }}
          </span>

          <span
            v-if="transaction"
            class="sentry-header__meta"
          >{{ transaction }}</span>

          <span
            v-if="release"
            class="sentry-header__meta"
          >{{ release }}</span>
        </div>

        <!-- Exception title + message -->
        <template v-if="mainException">
          <h2 class="sentry-header__type">
            {{ mainException.type }}
          </h2>
          <pre class="sentry-header__message">{{ mainException.value }}</pre>
        </template>

        <!-- Message-only event -->
        <template v-else-if="isMessageEvent">
          <h2 class="sentry-header__type">
            Message
          </h2>
          <pre class="sentry-header__message">{{ event.payload.message }}</pre>
        </template>

        <span class="sentry-header__date">{{ formattedTimestamp }}</span>
      </div>
    </template>

    <!-- Tabbed content -->
    <Tabs
      :options="{ useUrlFragment: false }"
      class="sentry-tabs"
    >
      <Tab
        v-if="hasException"
        name="Exceptions"
        :suffix="`<span class='tab-badge'>${exceptionsLength}</span>`"
      >
        <div class="sentry-tab-content">
          <div class="sentry-exceptions">
            <SentryException
              v-for="e in event.payload.exception!.values"
              :key="`exception-${e.value}-${e.type}`"
              :exception="e"
              :max-frames="10"
            />
          </div>
        </div>
      </Tab>

      <Tab
        v-if="hasBreadcrumbs"
        name="Breadcrumbs"
        :suffix="`<span class='tab-badge'>${event.payload.breadcrumbs!.values.length}</span>`"
      >
        <div class="sentry-tab-content">
          <SentryPageBreadcrumbs :breadcrumbs="event.payload.breadcrumbs!.values" />
        </div>
      </Tab>

      <Tab
        v-if="hasRequest"
        name="Request"
      >
        <div class="sentry-tab-content">
          <SentryPageRequest :request="event.payload.request!" />
        </div>
      </Tab>

      <Tab
        v-if="hasContextTab"
        name="Context"
      >
        <div class="sentry-tab-content sentry-tab-content--sections">
          <SentryPageTags :payload="event.payload" />

          <SentryPageTrace
            v-if="hasTraceContext"
            :trace="event.payload.contexts!.trace"
          />

          <SentryPageApp
            v-if="hasAppContext"
            :app="event.payload.contexts!.app!"
          />

          <SentryPageDevice
            v-if="hasDeviceContext"
            :device="event.payload.contexts!.device!"
          />
        </div>
      </Tab>

      <Tab
        v-if="hasSdk"
        name="SDK"
      >
        <div class="sentry-tab-content">
          <SentryPageSdk :sdk="event.payload.sdk!" />
        </div>
      </Tab>

      <Tab
        v-if="hasModules"
        name="Modules"
        :suffix="`<span class='tab-badge'>${Object.keys(event.payload.modules!).length}</span>`"
      >
        <div class="sentry-tab-content">
          <SentryPageModules :modules="event.payload.modules!" />
        </div>
      </Tab>

      <Tab
        v-if="hasExtra"
        name="Extra"
      >
        <div class="sentry-tab-content">
          <SentryPageExtra :extra="event.payload.extra" />
        </div>
      </Tab>
    </Tabs>
  </EventDetailLayout>
</template>

<style lang="scss" scoped>
.sentry-header {
  @apply flex flex-col;
}

.sentry-header__badges {
  @apply flex flex-wrap items-center gap-1.5 mb-3;
}

.sentry-header__badge {
  @apply text-2xs font-semibold uppercase px-2 py-0.5 rounded;
}

.sentry-header__badge--level {
  @apply tracking-wide;
}

.sentry-header__badge--error,
.sentry-header__badge--fatal {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.sentry-header__badge--warning {
  @apply bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400;
}

.sentry-header__badge--info {
  @apply bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400;
}

.sentry-header__badge--debug {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.sentry-header__badge--platform {
  @apply bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400;
}

.sentry-header__badge--handled {
  @apply bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400;
}

.sentry-header__badge--unhandled {
  @apply bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400;
}

.sentry-header__meta {
  @apply text-2xs font-mono px-2 py-0.5 rounded;
  @apply bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

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

/* Tabs */
.sentry-tabs {
  @apply -mx-5 md:-mx-6 lg:-mx-8;

  :deep(.tabs-component-tabs) {
    @apply px-5 md:px-6 lg:px-8;
  }
}

.sentry-tab-content {
  @apply px-5 md:px-6 lg:px-8 py-5;
}

.sentry-tab-content--sections {
  @apply flex flex-col gap-6;
}

.sentry-exceptions {
  @apply flex flex-col gap-3;
}
</style>

<!-- Global style for tab badges (rendered via innerHTML) -->
<style lang="scss">
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: theme('colors.gray.200');
  color: theme('colors.gray.500');
  vertical-align: top;
  margin-left: 4px;
  margin-top: -4px;

  .dark & {
    background: theme('colors.gray.700');
    color: theme('colors.gray.400');
  }

  .is-active & {
    background: theme('colors.blue.100');
    color: theme('colors.blue.600');

    .dark & {
      background: rgba(59, 130, 246, 0.15);
      color: theme('colors.blue.400');
    }
  }
}
</style>
