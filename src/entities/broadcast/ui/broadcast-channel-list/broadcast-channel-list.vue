<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { SearchBar } from '@/shared/ui'
import type { BroadcastChannel } from '../../lib/channels'
import { formatClock } from '../../lib/format'
import { broadcastProblems, channelKindLabel, PROBLEM_ICON } from '../../lib/payload'
import { ALL_CHANNELS, listKeyTarget } from '../../lib/use-broadcast-console'
import '../broadcast-theme.css'

// The console's channel list (#6614): «All channels», then one row per channel,
// newest activity first. Arrow keys, Home and End move between rows; Enter or
// Space picks one. One tab stop: the picked row (or the first).
type Props = {
  channels: BroadcastChannel[]
  selectedId: string | null
  totalEvents: number
  totalChannels: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [id: string] }>()
const filter = defineModel<string>('filter', { default: '' })

type Row = { id: string; channel: BroadcastChannel | null }
const rows = computed<Row[]>(() => [
  { id: ALL_CHANNELS, channel: null },
  ...props.channels.map((channel) => ({ id: channel.id, channel }))
])

// The one tab stop follows the focus (roving tabindex); a new pick moves it
// to the picked row.
const pickedIndex = () => Math.max(0, rows.value.findIndex((r) => r.id === props.selectedId))
const focusIndex = ref(pickedIndex())
watch(() => props.selectedId, () => (focusIndex.value = pickedIndex()))
const tabStop = computed(() => Math.min(focusIndex.value, rows.value.length - 1))

const list = ref<HTMLElement | null>(null)
const onKey = async (e: KeyboardEvent, index: number) => {
  const next = listKeyTarget(e.key, index, rows.value.length)
  if (next === null) return
  e.preventDefault()
  focusIndex.value = next
  await nextTick()
  list.value?.querySelectorAll<HTMLElement>('[data-channel-row]')[next]?.focus()
}

const lastLine = (c: BroadcastChannel) => {
  const p = c.last.payload
  const problem = broadcastProblems(p).find((x) => x.tone !== 'info')
  const time = formatClock(c.last.timestamp).slice(0, 8)
  const name = p.name.split('\\').pop()
  if (problem) return { tone: problem.tone, text: `${PROBLEM_ICON[problem.tone]} ${time} ${problem.text}` }
  if (c.channels.length > 1) return { tone: null, text: `${c.channels.length} channels · ${time} ${name}` }
  return { tone: null, text: `${time} ${name}` }
}
</script>

<template>
  <aside
    class="bc-channels"
    aria-label="Channels"
  >
    <div class="bc-channels__filter">
      <SearchBar
        v-model="filter"
        class="bc-channels__input"
        placeholder="Filter channels"
        label="Filter channels"
      />
    </div>
    <div
      ref="list"
      class="bc-channels__list"
    >
      <template
        v-for="(row, i) in rows"
        :key="row.id"
      >
        <p
          v-if="i === 1"
          class="bc-channels__head"
          aria-hidden="true"
        >
          <span>Channels</span><span>events</span>
        </p>
        <button
          type="button"
          class="bc-channels__row"
          :class="{ 'bc-channels__row--on': row.id === selectedId }"
          :aria-current="row.id === selectedId ? 'true' : undefined"
          :tabindex="i === tabStop ? 0 : -1"
          data-channel-row
          @click="emit('select', row.id)"
          @keydown="onKey($event, i)"
          @focus="focusIndex = i"
        >
          <template v-if="row.channel">
            <span class="bc-channels__kind">{{ channelKindLabel(row.channel.kind) }}</span>
            <span
              class="bc-channels__name"
              :title="row.channel.id"
            >{{ row.channel.id }}</span>
            <span class="bc-channels__count">{{ row.channel.count }}</span>
            <span
              class="bc-channels__last"
              :class="{
                'bc-channels__last--error': lastLine(row.channel).tone === 'error',
                'bc-channels__last--warning': lastLine(row.channel).tone === 'warning'
              }"
            >{{ lastLine(row.channel).text }}</span>
          </template>
          <template v-else>
            <span class="bc-channels__kind">all</span>
            <span class="bc-channels__name">All channels</span>
            <span class="bc-channels__count">{{ totalEvents }}</span>
            <span class="bc-channels__last">{{ totalChannels }} channel{{ totalChannels === 1 ? '' : 's' }}</span>
          </template>
        </button>
      </template>
      <p
        v-if="!channels.length && filter"
        class="bc-channels__none"
      >
        No channel matches “{{ filter }}”.
      </p>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.bc-channels {
  @apply flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
}

.bc-channels__filter {
  @apply p-3 border-b border-gray-200 dark:border-gray-700;
}

.bc-channels__input {
  @apply h-8;
}

.bc-channels__list {
  @apply flex-1 overflow-y-auto pb-2;
}

.bc-channels__head {
  @apply flex justify-between px-3 pt-2.5 pb-1 text-gray-600 dark:text-gray-400 font-semibold uppercase;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.bc-channels__row {
  @apply grid w-full px-3 py-1.5 text-left items-baseline;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 2px 8px;

  &:focus-visible {
    outline: 2px solid var(--bc-focus);
    outline-offset: -2px;
  }

  @media (max-width: 639px) {
    min-height: 52px;
  }
}

.bc-channels__row--on {
  background: var(--bc-sel) !important;
}

.bc-channels__kind {
  @apply font-mono text-center rounded-sm border text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600;
  font-size: 10px;
  line-height: 16px;
  padding: 0 4px;
  min-width: 66px;
}

.bc-channels__name {
  @apply font-mono text-xs text-gray-900 dark:text-gray-100 truncate;
}

.bc-channels__count {
  @apply font-mono text-gray-600 dark:text-gray-400;
  font-size: 11px;
}

.bc-channels__last {
  @apply truncate text-gray-600 dark:text-gray-400;
  grid-column: 2 / 4;
  font-size: 11px;
}

.bc-channels__last--error {
  color: var(--bc-err);
}

.bc-channels__last--warning {
  color: var(--bc-warn);
}

.bc-channels__none {
  @apply px-3 py-2 text-xs text-gray-600 dark:text-gray-400;
}
</style>
