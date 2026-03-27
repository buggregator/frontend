<script lang="ts" setup>
import { ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import { PageTabs, PageTab } from '@/shared/ui'
import { useProfilerCompare } from '../../lib/use-profiler-compare'
import type { Profiler } from '../../types'
import { CallGraph } from '../call-graph'
import { FlameGraph } from '../flame-graph'
import { ProfileCompare } from '../profile-compare'
import { TopFunctions } from '../top-functions'

type Props = {
  event: NormalizedEvent<Profiler>
}

defineProps<Props>()

const { compareBase, compareTarget, isReady, reset: resetCompare } = useProfilerCompare()

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

            <PageTab
              v-if="isReady"
              name="Comparison"
            >
              <div
                v-if="activeTab === 'Comparison'"
                class="profiler-page__compare"
              >
                <div class="profiler-page__compare-header">
                  <span class="profiler-page__compare-label">Comparing profiles</span>
                  <button
                    class="profiler-page__compare-reset"
                    @click="resetCompare"
                  >
                    Clear
                  </button>
                </div>
                <ProfileCompare
                  :base-id="compareBase!"
                  :compare-id="compareTarget!"
                />
              </div>
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

.profiler-page__compare {
  @apply flex flex-col h-full;
}

.profiler-page__compare-header {
  @apply flex items-center justify-between px-4 py-2;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.profiler-page__compare-label {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.profiler-page__compare-reset {
  @apply text-2xs px-2 py-0.5 rounded cursor-pointer;
  @apply text-red-500 hover:text-red-600;
  @apply hover:bg-red-50 dark:hover:bg-red-500/10;
  @apply transition-colors;
}
</style>
