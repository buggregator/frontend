import { computed, ref, type Ref } from 'vue'
import type { BroadcastEvent } from '../types'
import {
  buildChannelList,
  compareChannel,
  eventsOfChannel,
  matchesQuery,
  previousSameEvent,
  type BroadcastChannel
} from './channels'

// «All channels» in the list.
export const ALL_CHANNELS = '*'

export type StreamOrder = 'newest' | 'oldest'

// The state of the channel console (#6614): the channel list, the selected
// channel, the stream of its events and the event each one is compared with.
// `events`: broadcast events, any order; `query`: the header's search.
export const useBroadcastConsole = (events: Ref<BroadcastEvent[]>, query: Ref<string> = ref('')) => {
  // null: nothing picked yet; ALL_CHANNELS or a channel row id.
  const selectedId = ref<string | null>(null)
  const channelFilter = ref('')
  const order = ref<StreamOrder>('newest')
  const expandedId = ref<string | null>(null)

  const channels = computed<BroadcastChannel[]>(() => buildChannelList(events.value))

  const visibleChannels = computed(() => {
    const q = channelFilter.value.trim().toLowerCase()
    if (!q) return channels.value
    return channels.value.filter((c) => c.channels.some((name) => name.toLowerCase().includes(q)))
  })

  const isAll = computed(() => selectedId.value === ALL_CHANNELS)
  const selected = computed(() => channels.value.find((c) => c.id === selectedId.value) ?? null)
  // A channel that went away (cleared, deleted) is no selection.
  const hasSelection = computed(() => isAll.value || !!selected.value)

  const stream = computed<BroadcastEvent[]>(() => {
    if (!hasSelection.value) return []
    const list = eventsOfChannel(events.value, selected.value).filter((e) => matchesQuery(e, query.value))
    const sign = order.value === 'newest' ? -1 : 1
    return [...list].sort((a, b) => sign * ((a.timestamp ?? 0) - (b.timestamp ?? 0)))
  })

  const select = (id: string | null) => {
    selectedId.value = id
    expandedId.value = null
  }

  const toggle = (uuid: string) => {
    expandedId.value = expandedId.value === uuid ? null : uuid
  }

  // Opens one event: its first channel, the event unfolded. False while the
  // event is not loaded.
  const openEvent = (uuid: string): boolean => {
    const event = events.value.find((e) => e.uuid === uuid)
    if (!event) return false
    const first = event.payload?.channels?.[0]
    const row = first ? channels.value.find((c) => c.channels.includes(first)) : undefined
    selectedId.value = row ? row.id : ALL_CHANNELS
    expandedId.value = uuid
    return true
  }

  const comparedChannel = (event: BroadcastEvent) => compareChannel(event, selected.value)

  const previousOf = (event: BroadcastEvent) =>
    previousSameEvent(events.value, event, comparedChannel(event))

  return {
    selectedId,
    selected,
    isAll,
    hasSelection,
    channelFilter,
    order,
    expandedId,
    channels,
    visibleChannels,
    stream,
    select,
    toggle,
    openEvent,
    comparedChannel,
    previousOf
  }
}

// Arrow keys in a list of `length` rows: the row to focus next, or null for a
// key the list does not handle.
export const listKeyTarget = (key: string, index: number, length: number): number | null => {
  if (!length) return null
  switch (key) {
    case 'ArrowDown':
      return Math.min(index + 1, length - 1)
    case 'ArrowUp':
      return Math.max(index - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return null
  }
}
