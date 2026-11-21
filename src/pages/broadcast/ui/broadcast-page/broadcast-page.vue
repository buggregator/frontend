<script lang="ts" setup>
import { refDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutBase,
  LayoutSidebar,
  PageHeader,
  SetupGuide
} from '@/widgets/ui'
import {
  ALL_CHANNELS,
  BroadcastChannelList,
  BroadcastEventDetail,
  BroadcastEventRow,
  channelKindLabel,
  useBroadcastConsole,
  type BroadcastEvent
} from '@/entities/broadcast'
import { PAGES_SETTINGS } from '@/shared/constants'
import { useEvents } from '@/shared/lib/use-events'
import { useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { EventTypes } from '@/shared/types'
import { SkeletonLoader, StatusPanel } from '@/shared/ui'

// The broadcast type's page: the channel console (#6614, design #6598 B).
// Channels on the left, the events of the picked one on the right; an event
// unfolds in place with what changed since the previous one of its name.

const TYPE = EventTypes.Broadcast
const TITLE = PAGES_SETTINGS[TYPE].title

const route = useRoute()
const router = useRouter()
const { events, cachedEvents } = useEvents()
const { searchQuery, listState, listError } = storeToRefs(useEventsStore())
const { isConnectedWS } = storeToRefs(useConnectionStore())

// An event a link opened that the loaded list does not have (older than the
// list, or another period): fetched by uuid and kept here.
const fetched = ref<BroadcastEvent[]>([])
const all = computed(() => {
  const list = events.items.value.filter((e) => e.type === TYPE) as BroadcastEvent[]
  const known = new Set(list.map((e) => e.uuid))
  return [...list, ...fetched.value.filter((e) => !known.has(e.uuid))]
})
// Pause (the header's button) keeps the events that were on screen.
const isPaused = computed(() => (cachedEvents.idsByType.value[TYPE]?.length ?? 0) > 0)
const shown = computed(() => {
  if (!isPaused.value) return all.value
  const kept = new Set(cachedEvents.idsByType.value[TYPE])
  return all.value.filter((e) => kept.has(e.uuid))
})

const query = refDebounced(searchQuery, 150)
const consoleState = useBroadcastConsole(shown, query)
const {
  selectedId,
  selected,
  selectedRowId,
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
} = consoleState

const view = computed(() => {
  if (listState.value === 'loading' && !all.value.length) return 'loading'
  if (listState.value === 'error' && !all.value.length) return 'error'
  if (!all.value.length) return 'empty'
  return 'console'
})

// ---- the URL: ?channel= keeps the pick, ?event= opens one event --------------
const pendingEvent = ref(typeof route.query.event === 'string' ? route.query.event : '')
if (typeof route.query.channel === 'string') selectedId.value = route.query.channel

const missingEvent = ref('')
let fetching = ''
const fetchPending = async (uuid: string) => {
  fetching = uuid
  let found: BroadcastEvent | null = null
  try {
    const got = await events.getItem(uuid)
    if (got?.type === TYPE) found = got as BroadcastEvent
  } catch {
    // a failed load reads as not found
  }
  if (pendingEvent.value !== uuid) return
  if (found) fetched.value = [...fetched.value, found]
  else {
    missingEvent.value = uuid
    pendingEvent.value = ''
  }
}
const tryOpenPending = () => {
  const uuid = pendingEvent.value
  if (!uuid) return
  if (openEvent(uuid)) {
    pendingEvent.value = ''
    return
  }
  // not among the loaded events once the list is in: ask the server
  if (listState.value !== 'loading' && fetching !== uuid) fetchPending(uuid)
}
watch([all, listState], tryOpenPending, { immediate: true })

watch(selectedId, (id) => {
  const channel = id ?? undefined
  if (route.query.channel === channel && !route.query.event) return
  router.replace({ query: { ...route.query, channel, event: undefined } })
})

const pick = (id: string | null) => {
  pendingEvent.value = ''
  missingEvent.value = ''
  select(id)
}

const onPhoneSelect = (e: Event) => pick((e.target as HTMLSelectElement).value || null)

// ---- the stream ---------------------------------------------------------------
const streamTitle = computed(() => (isAll.value ? 'All channels' : (selected.value?.id ?? '')))
const streamNote = computed(() => {
  const n = stream.value.length
  const count = `${n} event${n === 1 ? '' : 's'}`
  if (isAll.value) return `${count} · ${channels.value.length} channel${channels.value.length === 1 ? '' : 's'}`
  const ch = selected.value
  if (!ch) return count
  const excluded = stream.value.filter((e) => e.payload.socket_id).length
  const parts = [channelKindLabel(ch.kind) === '#' ? 'public' : ch.kind, count]
  if (ch.channels.length > 1) parts.push(`${ch.channels.length} channels`)
  if (excluded) parts.push(`${excluded} sent with toOthers`)
  return parts.join(' · ')
})

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const pickText = computed(
  () =>
    `${plural(channels.value.length, 'channel')} got ${plural(shown.value.length, 'event')}. ` +
    'Pick one to see its events in order, each with what changed since the previous one of its name.'
)

const liveText = computed(() => (!isConnectedWS.value ? 'Offline' : isPaused.value ? 'Paused' : 'Live'))

const detailId = (uuid: string) => `bc-detail-${uuid}`

// Esc folds the open event back and returns the focus to its row. Not an Esc
// a field or a dialog already took (search, filter, shortcuts overlay).
const TEXT_FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const onKey = async (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || e.defaultPrevented || !expandedId.value) return
  const target = e.target as HTMLElement | null
  if (target && (TEXT_FIELDS.has(target.tagName) || target.isContentEditable)) return
  const id = expandedId.value
  expandedId.value = null
  await nextTick()
  document.querySelector<HTMLElement>(`[aria-controls="${detailId(id)}"]`)?.focus()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <LayoutBase :heading="TITLE">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <PageHeader
        :type="TYPE"
        :title="TITLE"
      />
    </template>

    <div
      class="bc-page bc-scope"
      :data-view="view"
    >
      <SkeletonLoader
        v-if="view === 'loading'"
        variant="card"
        aria-label="Loading broadcasts"
      />

      <StatusPanel
        v-else-if="view === 'error'"
        tone="error"
        title="Could not load broadcasts"
        :text="listError"
        action-label="Try again"
        @action="events.getAll()"
      />

      <!-- No broadcast yet: how to send the first one, like every section. -->
      <SetupGuide
        v-else-if="view === 'empty'"
        section-id="broadcast"
        :section-title="TITLE"
      />

      <template v-else>
        <StatusPanel
          v-if="listState === 'error'"
          tone="error"
          compact
          title="Could not load broadcasts"
          :text="listError"
          action-label="Try again"
          @action="events.getAll()"
        />

        <p
          v-if="missingEvent"
          class="bc-page__missing"
          role="status"
          data-test="bc-event-missing"
        >
          Event {{ missingEvent }} not found among the broadcasts: deleted, or not a broadcast.
        </p>

        <!-- Phones: the channels are a select above the stream. -->
        <div class="bc-page__phone-pick">
          <label
            for="bc-channel-select"
            class="sr-only"
          >Channel</label>
          <select
            id="bc-channel-select"
            class="bc-page__select"
            :value="selectedRowId ?? ''"
            @change="onPhoneSelect"
          >
            <option
              value=""
              disabled
            >
              Choose a channel
            </option>
            <option :value="ALL_CHANNELS">
              All channels ({{ shown.length }})
            </option>
            <option
              v-for="c in channels"
              :key="c.id"
              :value="c.id"
            >
              {{ c.id }} ({{ c.count }})
            </option>
          </select>
        </div>

        <div class="bc-page__console">
          <div class="bc-page__channels">
            <BroadcastChannelList
              v-model:filter="channelFilter"
              :channels="visibleChannels"
              :selected-id="selectedRowId"
              :total-events="shown.length"
              :total-channels="channels.length"
              @select="pick"
            />
          </div>

          <section
            class="bc-page__stream"
            aria-label="Events"
          >
            <StatusPanel
              v-if="!hasSelection"
              title="Pick a channel"
              :text="pickText"
              action-label="Show all channels"
              data-test="bc-no-channel"
              @action="pick(ALL_CHANNELS)"
            />

            <template v-else>
              <div class="bc-page__toolbar">
                <span class="bc-page__stream-title">{{ streamTitle }}</span>
                <span class="bc-page__muted">{{ streamNote }}</span>
                <span class="bc-page__spacer" />
                <span
                  class="bc-page__live"
                  :class="{ 'bc-page__live--off': liveText !== 'Live' }"
                ><i aria-hidden="true" />{{ liveText }}</span>
                <span
                  class="bc-page__seg"
                  role="group"
                  aria-label="Order"
                >
                  <button
                    type="button"
                    :aria-pressed="order === 'newest'"
                    @click="order = 'newest'"
                  >Newest first</button>
                  <button
                    type="button"
                    :aria-pressed="order === 'oldest'"
                    @click="order = 'oldest'"
                  >Oldest first</button>
                </span>
              </div>

              <div
                class="bc-page__rows"
                data-test="bc-rows"
              >
                <div
                  class="bc-page__row-head"
                  aria-hidden="true"
                >
                  <span>Time</span><span>Event</span><span>Channels</span><span>Payload</span><span>Size</span>
                </div>
                <template
                  v-for="e in stream"
                  :key="e.uuid"
                >
                  <BroadcastEventRow
                    :event="e"
                    :expanded="expandedId === e.uuid"
                    :controls="detailId(e.uuid)"
                    @toggle="toggle(e.uuid)"
                  />
                  <BroadcastEventDetail
                    v-if="expandedId === e.uuid"
                    :id="detailId(e.uuid)"
                    :event="e"
                    :previous="previousOf(e)"
                    :channel="comparedChannel(e)"
                  />
                </template>
                <StatusPanel
                  v-if="!stream.length"
                  compact
                  :title="`No event here matches “${query.trim()}”`"
                  data-test="bc-no-match"
                />
              </div>
            </template>
          </section>
        </div>
      </template>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.bc-page {
  @apply flex flex-col h-full min-h-0 bg-gray-50 dark:bg-gray-900;
}

.bc-page__console {
  @apply flex-1 min-h-0 grid;
  grid-template-columns: 300px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);

  @media (max-width: 639px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.bc-page__channels {
  display: grid;
  min-height: 0;

  @media (max-width: 639px) {
    display: none;
  }
}

.bc-page__phone-pick {
  display: none;
  @apply px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;

  @media (max-width: 639px) {
    display: block;
  }
}

.bc-page__select {
  @apply w-full h-11 px-2 rounded border font-mono text-sm;
  @apply bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
}

.bc-page__missing {
  @apply px-4 py-2 text-xs border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800;
}

.bc-page__stream {
  @apply flex flex-col min-w-0 min-h-0;
}

.bc-page__toolbar {
  @apply flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-2 border-b text-xs;
  @apply bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700;

  @media (max-width: 639px) {
    @apply px-3;
  }
}

.bc-page__stream-title {
  @apply font-mono font-semibold text-sm text-gray-900 dark:text-gray-100;
  word-break: break-all;
}

.bc-page__spacer {
  flex: 1;
}

.bc-page__muted {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.bc-page__live {
  @apply inline-flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bc-live);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--bc-live) 25%, transparent);
    animation: bc-live 1.6s ease-in-out infinite;
  }
}

.bc-page__live--off i {
  @apply bg-gray-500 dark:bg-gray-400;
  box-shadow: none;
  animation: none;
}

@keyframes bc-live {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bc-page__live i {
    animation: none;
  }
}

.bc-page__seg {
  @apply inline-flex rounded border border-gray-300 dark:border-gray-600 overflow-hidden;

  button {
    @apply px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400;

    & + button {
      @apply border-l border-gray-300 dark:border-gray-600;
    }

    &[aria-pressed='true'] {
      @apply font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700;
    }

    &:focus-visible {
      outline: 2px solid var(--bc-focus);
      outline-offset: -2px;
    }

    @media (max-width: 639px) {
      @apply px-3 py-2.5;
    }
  }
}

.bc-page__rows {
  @apply flex-1 overflow-y-auto;
}

.bc-page__row-head {
  @apply grid gap-3 px-4 items-center font-medium text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
  grid-template-columns: 96px minmax(120px, 210px) minmax(120px, 220px) minmax(0, 1fr) 72px;
  min-height: 30px;
  position: sticky;
  top: 0;
  z-index: 1;

  span:last-child {
    text-align: right;
  }

  @media (max-width: 767px) {
    display: none;
  }
}
</style>
