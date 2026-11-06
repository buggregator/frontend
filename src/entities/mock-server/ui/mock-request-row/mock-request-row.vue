<script lang="ts" setup>
import { computed } from 'vue'
import { delayText } from '../../lib/mock-format'
import { requestPath, withQuery } from '../../lib/mock-rule'
import type { MockRequestEvent } from '../../types'
import { MockBadge } from '../mock-badge'
import { MockNoMatch } from '../mock-no-match'
import { MockPath } from '../mock-path'

type Props = {
  event: MockRequestEvent
  ruleLabel?: string
  selected?: boolean
  fresh?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{ open: [event: MockRequestEvent] }>()

const mock = computed(() => props.event.payload.mock)
const path = computed(() =>
  withQuery(requestPath(props.event.payload.request.uri), props.event.payload.request.query)
)
const time = computed(() =>
  new Date(props.event.timestamp * 1000).toLocaleTimeString([], { hour12: false })
)
</script>

<template>
  <button
    type="button"
    class="mock-request-row"
    :class="{ 'mock-request-row--selected': selected, 'mock-request-row--fresh': fresh }"
    :aria-current="selected ? 'true' : undefined"
    @click="emit('open', event)"
  >
    <span class="mock-request-row__time">{{ time }}</span>
    <MockBadge :method="event.payload.request.method" />
    <MockPath
      class="mock-request-row__path"
      :path="path"
      truncate
    />
    <MockBadge :status="mock.status" />
    <span class="mock-request-row__rule">
      <template v-if="mock.matched">→ {{ ruleLabel || mock.rule_name || 'rule' }}</template>
      <MockNoMatch v-else />
    </span>
    <span class="mock-request-row__delay">{{ mock.delay_ms ? delayText(mock.delay_ms) : '' }}</span>
  </button>
</template>

<style lang="scss" scoped>
.mock-request-row {
  @apply grid w-full items-center gap-x-3 gap-y-1 px-4 py-2 text-left;
  @apply border-b border-gray-200 dark:border-gray-700;
  @apply hover:bg-gray-100 dark:hover:bg-white/5;
  grid-template-columns: 4.5rem auto minmax(0, 1fr) auto minmax(0, 12rem) 3.5rem;

  @media (max-width: 639px) {
    grid-template-columns: auto minmax(0, 1fr) auto;

    .mock-request-row__time,
    .mock-request-row__delay {
      @apply hidden;
    }

    .mock-request-row__rule {
      grid-column: 1 / -1;
    }
  }
}

.mock-request-row--selected {
  @apply bg-blue-50 dark:bg-blue-500/10;
  box-shadow: inset 3px 0 0 theme('colors.blue.600');
}

.mock-request-row--fresh {
  animation: mock-request-row-fresh 1.6s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes mock-request-row-fresh {
  from {
    @apply bg-blue-50 dark:bg-blue-500/10;
  }
}

.mock-request-row__time,
.mock-request-row__delay {
  @apply font-mono text-2xs text-gray-500 dark:text-gray-400 whitespace-nowrap;
}

.mock-request-row__delay {
  @apply text-right;
}

.mock-request-row__rule {
  @apply text-xs text-gray-600 dark:text-gray-300 truncate;
}
</style>
