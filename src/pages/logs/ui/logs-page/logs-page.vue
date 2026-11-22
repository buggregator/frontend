<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { LayoutBase, LayoutSidebar, SetupHelpButton, useSetupValues } from '@/widgets/ui'
import { MonologLogRow, monologTraceId, type Monolog } from '@/entities/monolog'
import { useVirtualFeed } from '@/shared/lib/use-virtual-feed'
import { PERIOD_OPTIONS, useEventsStore } from '@/shared/stores'
import { RouteName, type ServerEvent } from '@/shared/types'
import {
  AppHeader,
  PauseButton,
  PeriodSelect,
  SearchBar,
  SkeletonLoader,
  StatusPanel
} from '@/shared/ui'
import { BarHistogram } from '@/shared/ui/bar-histogram'
import { FacetPicker } from '@/shared/ui/facet-picker'
import {
  LOG_SERIES,
  hasNarrowing,
  matchesLog,
  searchWords,
  toLogBars,
  useLogsData,
  useLogsQuery,
  useLogsStream,
  windowSeconds
} from '../../lib'
import { LogsLevelChips } from '../logs-level-chips'

// Monolog records as one searchable, filterable stream (#6701, variant A):
// search and filters in the URL, counts per level and channel, lines per
// minute, the lines themselves live from the WebSocket with a pause.

useTitle('Logs | Buggregator')

const { activeProjectKey } = storeToRefs(useEventsStore())
const { filters, search, setFilters } = useLogsQuery()
const data = useLogsData(filters, activeProjectKey)
const {
  state,
  error,
  rows,
  facets,
  histogram,
  hasAnyLogs,
  hasMore,
  loadingMore,
  matchCount,
  totalCount,
  traceCounts
} = data

const stream = useLogsStream({
  matches: (e) => matchesLog(e, filters.value),
  onLines: data.addLines
})
const { paused, bufferedCount, bufferedMatchCount } = stream
// A new list is the newest anyway: what waited in the buffer is in it.
watch(state, (s) => s === 'loading' && stream.clearBuffer())

const words = computed(() => searchWords(filters.value.q))

// ---- filters ------------------------------------------------------------------
const levels = computed({
  get: () => filters.value.levels,
  set: (value: string[]) => setFilters({ levels: value })
})
const channels = computed({
  get: () => filters.value.channels,
  set: (value: string[]) => setFilters({ channels: value })
})
const period = computed({
  get: () => filters.value.window,
  set: (value: string) => setFilters({ window: value })
})
const levelCounts = computed(() =>
  Object.fromEntries((facets.value.level ?? []).map((x) => [x.value, x.count]))
)
const channelOptions = computed(() => facets.value.channel ?? [])
const narrowed = computed(() => hasNarrowing(filters.value))
const clearFilters = () => {
  search.value = ''
  setFilters({ q: '', levels: [], channels: [] })
}

// ---- what the page shows ------------------------------------------------------
const view = computed(() => {
  if (state.value === 'loading' && !rows.value.length) return 'loading'
  if (state.value === 'error') return 'error'
  if (!rows.value.length && state.value === 'ready') return hasAnyLogs.value ? 'no-match' : 'empty'
  return 'list'
})

const fmt = (n: number) => n.toLocaleString('en-US')
const windowPhrase = computed(() => {
  if (!windowSeconds(filters.value.window)) return 'over all time'
  const option = PERIOD_OPTIONS.find((o) => o.value === filters.value.window)
  return `in the ${(option?.label ?? filters.value.window).toLowerCase()}`
})

const noMatchText = computed(() =>
  narrowed.value
    ? `Nothing ${windowPhrase.value} matches the search and filters. Widen the time or clear them.`
    : `No lines ${windowPhrase.value}. Pick a wider time to see older ones.`
)

const { values: setupValues } = useSetupValues()
const emptyText = computed(
  () =>
    `Point Monolog's SocketHandler with the JSON formatter at ${setupValues.value.host}:${setupValues.value.monolog_port}; new lines show up here at once.`
)

// ---- the chart ----------------------------------------------------------------
const bars = computed(() => toLogBars(histogram.value, filters.value.window, data.countedAt.value))

// ---- live ---------------------------------------------------------------------
const togglePause = () => stream.setPaused(!paused.value)
const pausedNote = computed(() => {
  const n = bufferedCount.value
  const m = bufferedMatchCount.value
  return `${fmt(n)} new line${n === 1 ? '' : 's'} while paused (${m ? `${fmt(m)} match` : 'none match'})`
})

// ---- rows ---------------------------------------------------------------------
const rowKey = (e: ServerEvent<Monolog>) => `log-${e.uuid}`
const keys = computed(() => rows.value.map(rowKey))
const { scroller, range, padTop, padBottom } = useVirtualFeed(keys, { estimate: 30, firstPage: 60 })
const rendered = computed(() => rows.value.slice(range.value.start, range.value.end))

const expanded = ref(new Set<string>())
const isExpanded = (e: ServerEvent<Monolog>) => expanded.value.has(e.uuid)
const setExpanded = (e: ServerEvent<Monolog>, open: boolean) => {
  const next = new Set(expanded.value)
  if (open) next.add(e.uuid)
  else next.delete(e.uuid)
  expanded.value = next
}
const traceOf = (e: ServerEvent<Monolog>) =>
  monologTraceId(e.payload) ?? e.facets?.trace?.[0] ?? null
const traceCount = (e: ServerEvent<Monolog>) => {
  const id = traceOf(e)
  return id ? (traceCounts.value.get(id) ?? null) : null
}
</script>

<template>
  <LayoutBase heading="Logs">
    <template #sidebar>
      <LayoutSidebar />
    </template>

    <template #header>
      <AppHeader keep-title>
        <RouterLink
          :to="{ name: RouteName.Home }"
          class="logs-page__crumb"
        >
          Home
        </RouterLink>
        <span
          class="logs-page__sep"
          aria-hidden="true"
        >/</span>
        <span class="logs-page__current">Logs</span>

        <template #controls>
          <SetupHelpButton
            section-id="monolog"
            section-title="Logs"
          />
        </template>
      </AppHeader>
    </template>

    <div class="logs-page">
      <div
        class="logs-page__toolbar"
        role="search"
        aria-label="Filter logs"
      >
        <SearchBar
          v-model="search"
          class="logs-page__search"
          placeholder="Search message, channel, context…"
          label="Search logs"
        />
        <LogsLevelChips
          v-model="levels"
          class="logs-page__levels"
          :counts="levelCounts"
        />
        <div class="logs-page__controls">
          <FacetPicker
            v-model="channels"
            label="Channel"
            :options="channelOptions"
          />
          <PeriodSelect v-model="period" />
          <PauseButton
            class="logs-page__pause"
            :disabled-pause="false"
            :is-paused="paused"
            :total-new-events-count="bufferedCount"
            @toggle-update="togglePause"
          />
        </div>
      </div>

      <p
        v-if="filters.trace"
        class="logs-page__trace"
        data-test="logs-trace-filter"
      >
        <span>Lines of one request</span>
        <code class="logs-page__trace-id">{{ filters.trace }}</code>
        <button
          type="button"
          class="logs-page__link-btn"
          @click="setFilters({ trace: '' })"
        >
          Show all lines
        </button>
      </p>

      <SkeletonLoader
        v-if="view === 'loading'"
        variant="card"
        aria-label="Loading logs"
      />

      <StatusPanel
        v-else-if="view === 'error'"
        tone="error"
        title="Could not load the logs"
        :text="error"
        action-label="Try again"
        @action="data.load()"
      />

      <StatusPanel
        v-else-if="view === 'empty'"
        title="No logs yet"
        :text="emptyText"
        data-test="logs-empty"
      >
        <SetupHelpButton
          section-id="monolog"
          section-title="Logs"
        />
      </StatusPanel>

      <template v-else>
        <BarHistogram
          class="logs-page__chart"
          :bars="bars"
          :series="LOG_SERIES"
          label="Log lines per minute"
          :end-label="windowSeconds(filters.window) ? 'now' : ''"
        >
          <span
            class="logs-page__summary"
            data-test="logs-summary"
          >
            <template v-if="narrowed">
              <strong>{{ fmt(matchCount) }}</strong> {{ matchCount === 1 ? 'match' : 'matches' }}
              <template v-if="filters.q">
                for <mark class="logs-page__q">{{ filters.q }}</mark>
              </template>
              {{ windowPhrase }}
              <span class="logs-page__of">· of {{ fmt(totalCount) }} lines</span>
            </template>
            <template v-else>
              <strong>{{ fmt(totalCount) }}</strong> {{ totalCount === 1 ? 'line' : 'lines' }}
              {{ windowPhrase }}
            </template>
          </span>
        </BarHistogram>

        <p
          class="logs-page__paused"
          :class="{ 'logs-page__paused--on': paused && bufferedCount > 0 }"
          aria-live="polite"
          data-test="logs-paused"
        >
          <template v-if="paused && bufferedCount > 0">
            {{ pausedNote }} ·
            <button
              type="button"
              class="logs-page__link-btn"
              @click="stream.showBuffered()"
            >
              Show them
            </button>
          </template>
        </p>

        <StatusPanel
          v-if="view === 'no-match'"
          :title="narrowed ? 'No lines match' : 'No lines in this time'"
          :text="noMatchText"
          :action-label="narrowed ? 'Clear filters' : ''"
          data-test="logs-no-match"
          @action="clearFilters"
        />

        <div
          v-else
          ref="scroller"
          class="logs-page__list"
          role="list"
          :aria-label="`Log lines, ${rows.length} shown`"
          :aria-busy="state === 'loading'"
          data-test="logs-list"
        >
          <div :style="{ paddingTop: `${padTop}px`, paddingBottom: `${padBottom}px` }">
            <MonologLogRow
              v-for="e in rendered"
              :id="rowKey(e)"
              :key="e.uuid"
              role="listitem"
              data-virtual-item
              :event="e"
              :terms="words"
              :expanded="isExpanded(e)"
              :trace-count="traceCount(e)"
              @update:expanded="setExpanded(e, $event)"
            />
          </div>
          <div
            v-if="hasMore"
            class="logs-page__more"
          >
            <button
              type="button"
              class="logs-page__more-btn"
              :disabled="loadingMore"
              @click="data.loadMore()"
            >
              {{ loadingMore ? 'Loading…' : 'Load older lines' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.logs-page__crumb {
  @apply hidden sm:inline text-sm text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200 transition-colors;
}

.logs-page__sep {
  @apply hidden sm:inline text-gray-300 dark:text-gray-700 mx-1.5 text-sm;
}

.logs-page__current {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.logs-page {
  @apply flex flex-col h-full min-h-0 gap-2 px-3 pt-3 md:px-4;
}

.logs-page__toolbar {
  @apply flex flex-wrap items-center gap-2 min-w-0;
}

.logs-page__search {
  flex: 1 1 14rem;
  @apply max-w-md;
}

.logs-page__levels {
  @apply max-w-full;
}

.logs-page__controls {
  @apply flex flex-wrap items-center gap-2;
}

.logs-page__pause {
  @apply ml-auto;
}

@media (max-width: 639px) {
  .logs-page__search {
    @apply max-w-none basis-full;
  }

  .logs-page__controls {
    @apply w-full;
  }
}

.logs-page__trace {
  @apply flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300;
}

.logs-page__trace-id {
  @apply font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 break-all;
}

.logs-page__link-btn {
  @apply text-blue-700 dark:text-blue-300 underline underline-offset-2 rounded-sm;
  @apply hover:text-blue-900 dark:hover:text-blue-200;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}

.logs-page__summary {
  @apply text-gray-600 dark:text-gray-300;

  strong {
    @apply font-semibold text-gray-900 dark:text-gray-100;
  }
}

.logs-page__q {
  @apply font-mono px-1 rounded-sm bg-yellow-200 dark:bg-yellow-500/30 text-inherit;
}

.logs-page__of {
  @apply text-gray-500 dark:text-gray-400;
}

.logs-page__paused {
  @apply hidden;
}

.logs-page__paused--on {
  @apply block py-1.5 text-center text-xs rounded;
  @apply bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300;
}

.logs-page__list {
  @apply flex-1 min-h-0 overflow-y-auto -mx-3 md:-mx-4;
  @apply border-t border-gray-200 dark:border-gray-700;
  // useVirtualFeed keeps the first visible line in place itself.
  overflow-anchor: none;
}

.logs-page__more {
  @apply flex justify-center py-3;
}

.logs-page__more-btn {
  @apply h-7 px-3 rounded text-xs font-medium;
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors;

  &:focus-visible {
    @apply outline-none ring-2 ring-blue-600 dark:ring-blue-400;
  }
}
</style>
