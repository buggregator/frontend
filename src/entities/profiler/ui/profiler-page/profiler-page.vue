<script lang="ts" setup>
import type { NormalizedEvent } from '@/shared/types'
import { EventTabs, type TabItem } from '@/shared/ui'
import type { Profiler } from '../../types'
import { CallGraph } from '../call-graph'
import { FlameGraph } from '../flame-graph'
import { TopFunctions } from '../top-functions'

type Props = {
  event: NormalizedEvent<Profiler>
}

defineProps<Props>()

// Only the open view is mounted: each draws a large graph.
const tabs: TabItem[] = [
  { id: 'call-graph', label: 'Call graph' },
  { id: 'flamechart', label: 'Flamechart' },
  { id: 'top-functions', label: 'Top functions' }
]
</script>

<template>
  <div class="profiler-page">
    <div class="profiler-page__main">
      <div
        ref="info"
        class="profiler-page__stat"
      >
        <section class="profiler-page__stat-tabs">
          <EventTabs
            v-slot="{ tab }"
            :tabs="tabs"
            class="profiler-page__panel"
          >
            <CallGraph
              v-if="tab === 'call-graph'"
              :id="event.id"
              :payload="event.payload"
            />

            <FlameGraph
              v-else-if="tab === 'flamechart'"
              :id="event.id"
              :payload="event.payload"
            />

            <TopFunctions
              v-else-if="tab === 'top-functions'"
              :id="event.id"
              :payload="event.payload"
            />
          </EventTabs>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profiler-page {
  @apply relative h-full overflow-hidden;
}

.profiler-page__main {
  @apply flex flex-col h-full;
}

.profiler-page__stat {
  @apply w-full flex flex-col h-full overflow-hidden;
}

.profiler-page__stat-tabs {
  @apply bg-gray-50 dark:bg-gray-900 dark:text-gray-300 flex-1 flex flex-col overflow-hidden;
}

/* The panel is a flex child: without min-h-0 it grows to its content (a long
   Top functions table) and the parent clips it, so nothing scrolls. Bounded
   here, the view's own content scrolls (server#428). */
.profiler-page__panel {
  @apply flex-1 min-h-0 overflow-hidden;
}
</style>
