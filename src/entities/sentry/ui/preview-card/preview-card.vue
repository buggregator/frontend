<script lang="ts" setup>
import { computed } from 'vue'
import type { Ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import type { Sentry, SentryException as Exception } from '../../types'
import { SentryException } from '../sentry-exception'

type Props = {
  event: NormalizedEvent<Sentry>
  maxFrames?: number
  occurrenceCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 3,
  occurrenceCount: 0
})

const eventLink = computed(() => `/sentry/event/${props.event.id}`)

const exceptionValues = computed(() => props.event?.payload?.exception?.values || [])

const hasException = computed(() => exceptionValues.value.length > 0)

const message = computed(
  () => props.event.payload?.message || props.event.payload?.logentry?.message || ''
)

const exception: Ref<Exception> = computed(() =>
  exceptionValues.value.length > 0
    ? exceptionValues.value[0]
    : {
        type: 'Unknown',
        value: 'Something went wrong',
        stacktrace: {
          frames: []
        }
      }
)

const showBadge = computed(() => props.occurrenceCount > 1)
</script>

<template>
  <PreviewCard :event="event">
    <div class="sentry-body__wrapper">
      <SentryException
        v-if="hasException"
        :exception="exception"
        :max-frames="maxFrames"
      >
        <RouterLink
          :to="eventLink"
          class="sentry-body__link"
        >
          <h3 class="sentry-body__title">
            {{ exception.type }}
          </h3>

          <pre class="sentry-body__message">{{ exception.value }}</pre>
        </RouterLink>
      </SentryException>

      <div v-else-if="message">
        <RouterLink
          :to="eventLink"
          class="sentry-body__link"
        >
          <pre class="sentry-body__message">{{ message }}</pre>
        </RouterLink>
      </div>

      <div v-else>
        <RouterLink
          :to="eventLink"
          class="sentry-body__link"
        >
          <h3 class="sentry-body__title">
            {{ exception.type }}
          </h3>
          <pre class="sentry-body__message">{{ exception.value }}</pre>
        </RouterLink>
      </div>

      <div
        v-if="showBadge"
        class="sentry-body__count-badge"
      >
        <span class="sentry-body__count-num">{{ occurrenceCount }}</span>
        <span class="sentry-body__count-lbl">today</span>
      </div>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.sentry-body__wrapper {
  @apply relative;
}

.sentry-body__link {
  @apply block p-3 rounded overflow-hidden cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600 transition-colors;
}

.sentry-body__title {
  @apply mb-2 font-semibold text-sm;
}

.sentry-body__message {
  @apply text-xs break-words whitespace-pre-wrap overflow-auto;
  @apply p-2 rounded;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
  @apply font-mono;
}

.sentry-body__count-badge {
  @apply absolute top-2 right-2;
  @apply flex flex-col items-center justify-center;
  @apply w-10 h-10 rounded-full;
  @apply bg-rose-100 dark:bg-rose-900/40;
  @apply border border-rose-300 dark:border-rose-700;
  @apply text-rose-700 dark:text-rose-300;
}

.sentry-body__count-num {
  @apply text-xs font-bold leading-none;
}

.sentry-body__count-lbl {
  @apply text-[9px] leading-none mt-0.5 opacity-70;
}
</style>
