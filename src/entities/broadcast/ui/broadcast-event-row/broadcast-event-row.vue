<script lang="ts" setup>
import { computed } from 'vue'
import { formatBytes, formatClock } from '../../lib/format'
import { broadcastProblems, PROBLEM_ICON } from '../../lib/payload'
import type { BroadcastEvent } from '../../types'
import { BroadcastChannelTag } from '../broadcast-channel-tag'
import '../broadcast-theme.css'

// One event in the console's stream: time, name, channels, the start of the
// data, size. A button: it unfolds the event in place (#6614).
type Props = {
  event: BroadcastEvent
  expanded?: boolean
  controls?: string
  // Channel tags shown before «+N».
  maxChannels?: number
}

const props = withDefaults(defineProps<Props>(), { expanded: false, controls: undefined, maxChannels: 1 })
defineEmits<{ toggle: [] }>()

// Pusher's limit (handler.go maxDataBytes).
const LIMIT = 10 * 1024

const p = computed(() => props.event.payload)
const shownChannels = computed(() => p.value.channels.slice(0, props.maxChannels))
const moreChannels = computed(() => p.value.channels.length - shownChannels.value.length)
const preview = computed(() => (p.value.encrypted ? 'encrypted' : p.value.data.slice(0, 200)))
const worst = computed(() => {
  const tones = broadcastProblems(p.value).map((x) => x.tone)
  return tones.includes('error') ? 'error' : tones.includes('warning') ? 'warning' : null
})
// The short name: Laravel sends the class (Illuminate\Notifications\…\Name).
const shortName = computed(() => p.value.name.split('\\').pop() || p.value.name)
</script>

<template>
  <button
    type="button"
    class="bc-row"
    :class="{ 'bc-row--open': expanded }"
    :aria-expanded="expanded"
    :aria-controls="controls"
    @click="$emit('toggle')"
  >
    <span class="bc-row__time">{{ formatClock(event.timestamp) }}</span>
    <span
      class="bc-row__name"
      :title="p.name"
    >{{ shortName }}</span>
    <span class="bc-row__channels">
      <BroadcastChannelTag
        v-for="c in shownChannels"
        :key="c"
        :channel="c"
      />
      <span
        v-if="moreChannels > 0"
        class="bc-row__more"
      >+{{ moreChannels }}</span>
    </span>
    <span class="bc-row__data">
      <span
        v-if="worst"
        class="bc-row__problem"
        :class="`bc-row__problem--${worst}`"
        :aria-label="worst"
      >{{ PROBLEM_ICON[worst] }}</span>{{ preview }}
    </span>
    <span
      class="bc-row__size"
      :class="{ 'bc-row__size--over': p.size > LIMIT }"
    >{{ formatBytes(p.size) }}</span>
  </button>
</template>

<style lang="scss" scoped>
.bc-row {
  @apply grid items-center gap-3 w-full px-4 text-left text-xs border-b border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700;
  grid-template-columns: 96px minmax(120px, 210px) minmax(120px, 220px) minmax(0, 1fr) 72px;
  min-height: 38px;

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: -2px;
  }

  @media (max-width: 767px) {
    @apply px-3 py-2;
    grid-template-columns: 92px minmax(0, 1fr) 64px;
    grid-template-areas: 't e s' 'c c c' 'p p p';
    row-gap: 4px;
    min-height: 44px;

    .bc-row__time {
      grid-area: t;
    }

    .bc-row__name {
      grid-area: e;
    }

    .bc-row__channels {
      grid-area: c;
    }

    .bc-row__data {
      grid-area: p;
    }

    .bc-row__size {
      grid-area: s;
    }
  }
}

.bc-row--open {
  background: var(--bc-sel) !important;
}

.bc-row__time {
  @apply font-mono text-gray-600 dark:text-gray-400;
}

.bc-row__name {
  @apply font-mono font-semibold text-gray-900 dark:text-gray-100 truncate;
}

.bc-row__channels {
  @apply flex gap-1 min-w-0 overflow-hidden;
}

.bc-row__more {
  @apply font-mono text-gray-600 dark:text-gray-400 flex-none;
  font-size: 11px;
}

.bc-row__data {
  @apply font-mono text-gray-600 dark:text-gray-400 truncate;
}

.bc-row__problem {
  @apply font-bold mr-1.5;
}

.bc-row__problem--error {
  color: var(--bc-err);
}

.bc-row__problem--warning {
  color: var(--bc-warn);
}

.bc-row__size {
  @apply font-mono text-right text-gray-600 dark:text-gray-400 whitespace-nowrap;
}

.bc-row__size--over {
  @apply font-semibold;
  color: var(--bc-warn);
}
</style>
