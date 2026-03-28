<script lang="ts" setup>
import moment from 'moment'
import { computed, ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { EventDetailLayout, PageTabs, PageTab } from '@/shared/ui'
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
const isMessageEvent = computed(
  () =>
    !mainException.value && (props.event.payload.message || props.event.payload.logentry?.message)
)

const isHandled = computed(() => {
  if (!mainException.value?.mechanism) return undefined
  return mainException.value.mechanism.handled
})

// Tab visibility
const hasException = computed(
  () => props.event.payload.exception?.values && props.event.payload.exception.values.length > 0
)
const hasBreadcrumbs = computed(
  () => props.event.payload.breadcrumbs?.values && props.event.payload.breadcrumbs.values.length > 0
)
const hasRequest = computed(() => !!props.event.payload.request)
const hasModules = computed(
  () => props.event.payload.modules && Object.keys(props.event.payload.modules).length > 0
)
const hasExtra = computed(() => !!props.event.payload.extra)
const hasTraceContext = computed(() => !!props.event.payload.contexts?.trace)
const hasAppContext = computed(() => !!props.event.payload.contexts?.app)
const hasDeviceContext = computed(() => !!props.event.payload.contexts?.device)
const hasContextTab = computed(
  () =>
    hasTraceContext.value ||
    hasAppContext.value ||
    hasDeviceContext.value ||
    props.event.payload.contexts?.runtime ||
    props.event.payload.contexts?.os
)
const hasSdk = computed(() => !!props.event.payload.sdk)

const exceptionRefs = ref<HTMLElement[]>([])

const scrollToException = (idx: number) => {
  const el = exceptionRefs.value[idx]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
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
          <pre class="sentry-header__message">{{
            event.payload.message || event.payload.logentry?.message
          }}</pre>
        </template>

        <span class="sentry-header__date">{{ formattedTimestamp }}</span>
      </div>
    </template>

    <!-- Tabbed content -->
    <PageTabs class="sentry-tabs">
      <PageTab
        v-if="hasException"
        name="Exceptions"
        :suffix="`<span class='tab-badge'>${exceptionsLength}</span>`"
      >
        <div class="sentry-tab-content">
          <div class="sentry-exceptions">
            <div
              v-for="(e, idx) in event.payload.exception!.values"
              :ref="
                (el) => {
                  if (el) exceptionRefs[idx] = el as HTMLElement
                }
              "
              :key="`exception-${e.value}-${e.type}`"
              class="sentry-exceptions__item"
            >
              <!-- Rail -->
              <div class="sentry-exceptions__rail">
                <!-- Dot with arrow (clickable) or plain dot (last) -->
                <button
                  v-if="idx < event.payload.exception!.values.length - 1"
                  class="sentry-exceptions__dot"
                  :class="{ 'sentry-exceptions__dot--first': idx === 0 }"
                  title="Scroll to next exception"
                  @click="scrollToException(idx + 1)"
                >
                  <svg
                    viewBox="0 0 10 6"
                    fill="none"
                    class="sentry-exceptions__dot-arrow"
                  >
                    <path
                      d="M1.5 1L5 4.5L8.5 1"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <span
                  v-else
                  class="sentry-exceptions__dot sentry-exceptions__dot--end"
                />

                <!-- Connecting line to next dot -->
                <div
                  v-if="idx < event.payload.exception!.values.length - 1"
                  class="sentry-exceptions__line"
                />
              </div>

              <!-- Exception card -->
              <div class="sentry-exceptions__card">
                <span
                  v-if="idx > 0"
                  class="sentry-exceptions__caused"
                >Caused by</span>
                <SentryException
                  :exception="e"
                  :max-frames="10"
                />
              </div>
            </div>
          </div>
        </div>
      </PageTab>

      <PageTab
        v-if="hasBreadcrumbs"
        name="Breadcrumbs"
        :suffix="`<span class='tab-badge'>${event.payload.breadcrumbs!.values.length}</span>`"
      >
        <div class="sentry-tab-content">
          <SentryPageBreadcrumbs :breadcrumbs="event.payload.breadcrumbs!.values" />
        </div>
      </PageTab>

      <PageTab
        v-if="hasRequest"
        name="Request"
      >
        <div class="sentry-tab-content">
          <SentryPageRequest :request="event.payload.request!" />
        </div>
      </PageTab>

      <PageTab
        v-if="hasContextTab"
        name="Context"
      >
        <div class="sentry-tab-content sentry-tab-content--sections">
          <SentryPageTags :payload="event.payload" />

          <SentryPageTrace
            v-if="hasTraceContext && event.payload.contexts!.trace"
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
      </PageTab>

      <PageTab
        v-if="hasSdk"
        name="SDK"
      >
        <div class="sentry-tab-content">
          <SentryPageSdk :sdk="event.payload.sdk!" />
        </div>
      </PageTab>

      <PageTab
        v-if="hasModules"
        name="Modules"
        :suffix="`<span class='tab-badge'>${Object.keys(event.payload.modules!).length}</span>`"
      >
        <div class="sentry-tab-content">
          <SentryPageModules
            :modules="event.payload.modules!"
            :platform="platform"
          />
        </div>
      </PageTab>

      <PageTab
        v-if="hasExtra"
        name="Extra"
      >
        <div class="sentry-tab-content">
          <SentryPageExtra :extra="event.payload.extra" />
        </div>
      </PageTab>
    </PageTabs>
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
  @apply flex flex-col;
}

.sentry-exceptions__item {
  @apply flex;
  scroll-margin-top: 80px;
}

/* Rail: column with dot at top, line filling the rest */
.sentry-exceptions__rail {
  @apply flex flex-col items-center flex-shrink-0;
  width: 28px;
  margin-right: 12px;
}

/* Dot: clickable circle with arrow */
.sentry-exceptions__dot {
  @apply flex items-center justify-center flex-shrink-0 rounded-full;
  @apply w-7 h-7;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply text-gray-400 dark:text-gray-500;
  @apply cursor-pointer transition-all duration-100;

  &:hover {
    @apply bg-gray-200 dark:bg-gray-700;
    @apply text-gray-600 dark:text-gray-300;
    @apply border-gray-300 dark:border-gray-600;
  }
}

.sentry-exceptions__dot--first {
  @apply bg-rose-50 dark:bg-rose-500/10;
  @apply border-rose-200 dark:border-rose-500/25;
  @apply text-rose-400 dark:text-rose-400;

  &:hover {
    @apply bg-rose-100 dark:bg-rose-500/20;
    @apply text-rose-500 dark:text-rose-300;
    @apply border-rose-300 dark:border-rose-500/40;
  }
}

.sentry-exceptions__dot--end {
  @apply w-3 h-3 cursor-default;
  @apply bg-gray-300 dark:bg-gray-600;
  @apply border-0;

  &:hover {
    @apply bg-gray-300 dark:bg-gray-600;
  }
}

.sentry-exceptions__dot-arrow {
  @apply w-3 h-3;
}

/* Vertical line connecting dot to next item's dot */
.sentry-exceptions__line {
  @apply flex-1;
  width: 2px;
  @apply bg-gray-200 dark:bg-gray-700;
}

.sentry-exceptions__card {
  @apply flex-1 min-w-0 pb-5;
}

.sentry-exceptions__caused {
  @apply text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-400 dark:text-gray-500;
  @apply mb-1.5 block;
}
</style>
