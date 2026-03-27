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
}

const props = withDefaults(defineProps<Props>(), {
  maxFrames: 3
})

const eventLink = computed(() => `/sentry/${props.event.id}`)

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
</script>

<template>
  <PreviewCard :event="event">
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

    <div v-if="message">
      <pre class="sentry-body__message">{{ message }}</pre>
    </div>
  </PreviewCard>
</template>

<style lang="scss" scoped>
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
</style>
