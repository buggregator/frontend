<script lang="ts" setup>
import { computed } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PreviewCard } from '@/shared/ui'
import { formatBytes } from '../../lib/format'
import { broadcastProblems, PROBLEM_ICON } from '../../lib/payload'
import type { BroadcastPayload } from '../../types'
import { BroadcastChannelTag } from '../broadcast-channel-tag'
import '../broadcast-theme.css'

// A broadcast in the main feed (#6614): name → channels, the start of the
// data, problems, size. It opens the channel console on this event.
type Props = {
  event: NormalizedEvent<BroadcastPayload>
}

const props = defineProps<Props>()

const MAX_CHANNELS = 3

const p = computed(() => props.event.payload)
const link = computed(() => ({ path: '/broadcast', query: { event: props.event.id } }))
const shortName = computed(() => p.value.name.split('\\').pop() || p.value.name)
const channels = computed(() => p.value.channels.slice(0, MAX_CHANNELS))
const more = computed(() => p.value.channels.length - channels.value.length)
const problems = computed(() => broadcastProblems(p.value))
const data = computed(() => (p.value.encrypted ? '' : p.value.data.slice(0, 300)))
const forwarded = computed(() => {
  const u = p.value.upstream
  if (!u) return ''
  return u.error ? 'forward failed' : `forwarded: ${u.status ?? '?'}, ${u.time_ms} ms`
})
</script>

<template>
  <PreviewCard :event="event">
    <RouterLink
      :to="link"
      class="bc-card bc-scope"
    >
      <span class="bc-card__head">
        <b
          class="bc-card__name"
          :title="p.name"
        >{{ shortName }}</b>
        <span
          class="bc-card__arrow"
          aria-label="to"
        >→</span>
        <BroadcastChannelTag
          v-for="c in channels"
          :key="c"
          :channel="c"
        />
        <span
          v-if="more > 0"
          class="bc-card__more"
        >+{{ more }} more</span>
      </span>

      <span
        v-if="problems.length"
        class="bc-card__problems"
      >
        <span
          v-for="x in problems"
          :key="x.text"
          class="bc-card__problem"
          :class="`bc-card__problem--${x.tone}`"
        ><span aria-hidden="true">{{ PROBLEM_ICON[x.tone] }}</span> {{ x.text }}</span>
      </span>

      <span
        v-if="data"
        class="bc-card__data"
      >{{ data }}</span>

      <span class="bc-card__foot">
        <span>{{ formatBytes(p.size) }}</span>
        <span v-if="p.socket_id">except socket {{ p.socket_id }}</span>
        <span v-if="p.batch_size">batch of {{ p.batch_size }}</span>
        <span v-if="p.library">{{ p.library }}</span>
        <span v-if="forwarded">{{ forwarded }}</span>
      </span>
    </RouterLink>
  </PreviewCard>
</template>

<style lang="scss" scoped>
.bc-card {
  @apply flex flex-col gap-1.5 p-3 rounded border cursor-pointer;
  @apply bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700;
  @apply hover:border-gray-300 dark:hover:border-gray-600;

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: 2px;
  }
}

.bc-card__head {
  @apply flex flex-wrap items-center gap-1.5 min-w-0;
}

.bc-card__name {
  @apply font-mono font-semibold text-sm text-gray-900 dark:text-gray-100;
  word-break: break-all;
}

.bc-card__arrow,
.bc-card__more {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.bc-card__problems {
  @apply flex flex-wrap gap-1;
}

.bc-card__problem {
  @apply inline-flex items-center gap-1 px-1.5 rounded-sm border text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600;
  font-size: 11px;
  line-height: 18px;
}

.bc-card__problem--error {
  border-color: var(--bc-err);
  color: var(--bc-err);
}

.bc-card__problem--warning {
  border-color: var(--bc-warn);
  color: var(--bc-warn);
}

.bc-card__data {
  @apply font-mono text-xs text-gray-700 dark:text-gray-300 line-clamp-2;
  word-break: break-all;
}

.bc-card__foot {
  @apply flex flex-wrap gap-x-3.5 gap-y-1 text-gray-600 dark:text-gray-400;
  font-size: 11px;
}
</style>
