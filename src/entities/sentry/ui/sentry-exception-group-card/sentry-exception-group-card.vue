<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouteName } from '@/shared/types'
import type { SentryErrorGroup } from '../../types'

type Props = {
  group: SentryErrorGroup
}

const props = defineProps<Props>()
const router = useRouter()

const shortClassName = (fullName: string) => {
  if (!fullName) return 'Unknown'
  const parts = fullName.replace(/\\\\/g, '\\').split('\\')
  return parts[parts.length - 1]
}

const formatTime = (ts: string) => {
  if (!ts) return ''
  return moment(ts).fromNow()
}

const navigateToSample = () => {
  if (props.group.sample_event_id) {
    router.push({
      name: RouteName.SentryExceptionDetail,
      params: { id: props.group.sample_event_id }
    })
  }
}

const isHandled = computed(() => props.group.handled)
</script>

<template>
  <div
    class="exc-group"
    @click="navigateToSample"
  >
    <!-- Header: badges + time -->
    <div class="exc-group__header">
      <span class="exc-group__type-badge">
        <span class="exc-group__type-shape" />
        sentry
      </span>

      <span
        class="exc-group__label"
        :class="`exc-group__label--${group.level}`"
      >
        {{ group.level }}
      </span>

      <span
        class="exc-group__label"
        :class="isHandled ? 'exc-group__label--handled' : 'exc-group__label--unhandled'"
      >
        {{ isHandled ? 'Handled' : 'Unhandled' }}
      </span>

      <span class="exc-group__count-label">
        <span class="exc-group__count-num">{{ group.count }}</span>
        events
      </span>

      <span class="exc-group__time">{{ formatTime(group.last_seen) }}</span>
    </div>

    <!-- Exception info block -->
    <div class="exc-group__body">
      <div
        class="exc-group__exception-type"
        :title="group.exception_type"
      >
        {{ shortClassName(group.exception_type) }}
      </div>

      <pre class="exc-group__message">{{ group.exception_value }}</pre>
    </div>

    <!-- Footer meta -->
    <div class="exc-group__footer">
      <span class="exc-group__meta">
        <span class="exc-group__meta-key">First seen</span>
        {{ formatTime(group.first_seen) }}
      </span>
      <span class="exc-group__meta">
        <span class="exc-group__meta-key">Last seen</span>
        {{ formatTime(group.last_seen) }}
      </span>
      <span class="exc-group__meta">
        <span class="exc-group__meta-key">Fingerprint</span>
        <span class="exc-group__meta-mono">{{ group.fingerprint.substring(0, 8) }}</span>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exc-group {
  @apply flex flex-col px-3 py-2.5 lg:px-4 lg:py-3 cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply border-l-[3px] border-l-rose-500;
  @apply transition-all duration-100;

  &:hover {
    @apply bg-gray-50 dark:bg-gray-900;
  }
}

.exc-group__header {
  @apply flex flex-wrap items-center gap-1.5;
}

.exc-group__type-badge {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs font-semibold uppercase tracking-wide;
  @apply text-rose-600 dark:text-rose-400;
  @apply bg-rose-50 dark:bg-rose-500/10;
}

.exc-group__type-shape {
  @apply flex-shrink-0 rounded-full;
  width: 6px;
  height: 6px;
  background: currentColor;
  opacity: 0.6;
}

.exc-group__label {
  @apply inline-flex items-center px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300;
}

.exc-group__label--error,
.exc-group__label--fatal {
  @apply font-semibold;
  @apply text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10;
}

.exc-group__label--warning {
  @apply font-semibold;
  @apply text-amber-600 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-500/10;
}

.exc-group__label--info {
  @apply text-blue-600 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-500/10;
}

.exc-group__label--debug {
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-100 dark:bg-gray-600/50;
}

.exc-group__label--handled {
  @apply text-green-600 dark:text-green-400;
  @apply bg-green-50 dark:bg-green-500/10;
}

.exc-group__label--unhandled {
  @apply font-semibold;
  @apply text-red-600 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-500/10;
}

.exc-group__count-label {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs font-medium;
  @apply bg-rose-50 dark:bg-rose-500/10;
  @apply text-rose-600 dark:text-rose-400;
}

.exc-group__count-num {
  @apply font-bold;
}

.exc-group__time {
  @apply text-2xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap ml-auto;
}

.exc-group__body {
  @apply mt-2;
}

.exc-group__exception-type {
  @apply font-bold text-sm break-all sm:break-normal mb-1;
  @apply text-gray-800 dark:text-gray-100;
}

.exc-group__message {
  @apply text-xs break-words whitespace-pre-wrap;
  @apply p-2 rounded font-mono line-clamp-2;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
  @apply border border-gray-200 dark:border-gray-700;
}

.exc-group__footer {
  @apply flex flex-wrap items-center gap-2 mt-2;
}

.exc-group__meta {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs;
  @apply bg-gray-100 dark:bg-gray-600/30;
}

.exc-group__meta-key {
  @apply text-gray-400 dark:text-gray-500;
}

.exc-group__meta-mono {
  @apply font-mono text-gray-600 dark:text-gray-300;
}
</style>
