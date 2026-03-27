<script lang="ts" setup>
import { ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PageTabs, PageTab } from '@/shared/ui'
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
          <PageTabs @changed="tabChange">
            <PageTab name="Call graph">
              <CallGraph
                v-if="activeTab === 'Call graph'"
                :id="event.id"
                :key="activeTab"
                :payload="event.payload"
              />
            </PageTab>

            <PageTab name="Flamechart">
              <FlameGraph
                v-if="activeTab === 'Flamechart'"
                :id="event.id"
                :key="activeTab"
                :data-key="activeTab"
                :payload="event.payload"
              />
            </PageTab>

            <PageTab name="Top functions">
              <TopFunctions
                v-if="activeTab === 'Top functions'"
                :id="event.id"
                :key="activeTab"
                :payload="event.payload"
              />
            </PageTab>
          </PageTabs>
        </section>
      </div>
    </main>
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

  :deep(.tabs-component-tabs) {
    @apply bg-white dark:bg-gray-800 px-4;
  }
}

.profiler-page__stat-tabs :deep(.tabs-component-panel) {
  @apply flex-1 overflow-hidden;
}
</style>
