<script lang="ts" setup>
import { ref } from 'vue'
import { Tabs, Tab } from 'vue3-tabs-component'
import type { NormalizedEvent } from '@/shared/types'
import type { Profiler } from '../../types'
import { CallGraph } from '../call-graph'
import { FlameGraph } from '../flame-graph'
import { TopFunctions } from '../top-functions'

type Props = {
  event: NormalizedEvent<Profiler>
}

defineProps<Props>()

const activeTab = ref('')

const tabChange = (selectedTab: { tab: { name: string } }) => {
  activeTab.value = selectedTab.tab.name
}
</script>

<template>
  <div class="profiler-page">
    <main class="profiler-page__main">
      <div
        ref="info"
        class="profiler-page__stat"
      >
        <section class="profiler-page__stat-tabs">
          <Tabs
            :options="{ useUrlFragment: false }"
            @changed="tabChange"
          >
            <Tab name="Call graph">
              <CallGraph
                v-if="activeTab === 'Call graph'"
                :id="event.id"
                :key="activeTab"
                :payload="event.payload"
              />
            </Tab>

            <Tab name="Flamechart">
              <FlameGraph
                v-if="activeTab === 'Flamechart'"
                :id="event.id"
                :key="activeTab"
                :data-key="activeTab"
                :payload="event.payload"
              />
            </Tab>

            <Tab name="Top functions">
              <TopFunctions
                v-if="activeTab === 'Top functions'"
                :id="event.id"
                :key="activeTab"
                :payload="event.payload"
              />
            </Tab>
          </Tabs>
        </section>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.profiler-page {
  @apply relative h-full;
}

.profiler-page__main {
  @apply flex flex-col md:flex-row h-full;
}

.profiler-page__callstack {
  @apply w-full md:w-[250px] border-r border-gray-300 dark:border-gray-500;
}

.profiler-page__stat {
  @apply w-full flex flex-col;
}

.profiler-page__stat-board {
  @apply bg-gray-200 dark:bg-gray-800;
}

.profiler-page__stat-tabs {
  @apply bg-gray-200 flex-1 flex flex-col dark:bg-gray-800 dark:text-gray-300;
}

.profiler-page__stat-tabs .tabs-component-panel {
  @apply h-full;
}
</style>
