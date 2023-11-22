<script lang="ts" setup>
import { computed, ref } from "vue";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { Tabs, Tab } from "vue3-tabs-component";
import type { Profiler, ProfilerEdge } from "~/src/entities/profiler/types";
import type { NormalizedEvent } from "~/src/shared/types";
import { StatBoard } from "~/src/shared/ui";
import type { CallStackHoverData } from "../../types";
import { CallGraph } from "../call-graph";
import { CallStack } from "../call-stack";
import { CallStatBoard } from "../call-stat-board";
import { FlameGraph } from "../flame-graph";

type Props = {
  event: NormalizedEvent<Profiler>;
};

defineProps<Props>();

const defaultPosition = { x: 0, y: 0 };

const activeEdge = ref<ProfilerEdge | null>();
const activeTab = ref("");
const activeEdgePosition = ref(defaultPosition);

const activeEdgeStyle = computed(() => {
  const width = 750;
  const height = 150;

  let top = activeEdgePosition.value.y;
  let left = activeEdgePosition.value.x;

  if (width + activeEdgePosition.value.x > window.innerWidth - 80) {
    const deltaX = width + activeEdgePosition.value.x - window.innerWidth + 100;
    left -= deltaX;
  }

  if (height + activeEdgePosition.value.y > window.innerHeight) {
    top = activeEdgePosition.value.y - height;
  }

  return {
    top: `${top + 10}px`,
    left: `${left}px`,
    width: `${width}px`,
  };
});

const setActiveEdge = (value: CallStackHoverData | undefined) => {
  if (value) {
    const { position, ...edge } = value || {};

    activeEdge.value = edge;
    activeEdgePosition.value = position;
  } else {
    activeEdge.value = null;
    activeEdgePosition.value = defaultPosition;
  }
};

const tabChange = (selectedTab: { tab: { name: string } }) => {
  activeTab.value = selectedTab.tab.name;
};
</script>

<template>
  <div class="profiler-page">
    <div class="profiler-page__head"></div>
    <main class="profiler-page__main">
      <section ref="calls" class="profiler-page__callstack">
        <PerfectScrollbar :style="{ height: 'calc(100vh - 48px)' }">
          <CallStack
            :payload="event.payload"
            @hover="setActiveEdge"
            @hide="setActiveEdge"
          />
        </PerfectScrollbar>
      </section>

      <div ref="info" class="profiler-page__stat">
        <section class="profiler-page__stat-board">
          <StatBoard :cost="event.payload.peaks" />
        </section>

        <section class="profiler-page__stat-tabs">
          <Tabs :options="{ useUrlFragment: false }" @changed="tabChange">
            <Tab name="Call graph">
              <CallGraph
                v-if="activeTab === 'Call graph'"
                :payload="event.payload"
              />
            </Tab>

            <Tab name="Flamechart">
              <FlameGraph
                v-if="activeTab === 'Flamechart'"
                :key="activeTab"
                :data-key="activeTab"
                :edges="event.payload.edges"
                @hover="setActiveEdge"
                @hide="setActiveEdge"
              />
            </Tab>
          </Tabs>
        </section>
      </div>

      <CallStatBoard
        v-if="activeEdge"
        class="profiler-page__hover-edge"
        :edge="activeEdge"
        :style="activeEdgeStyle"
      />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.profiler-page {
  @apply relative;
}

.profiler-page__main {
  @apply flex flex-col md:flex-row;
}

.profiler-page__callstack {
  @apply w-full md:w-[250px] border-r border-gray-300 dark:border-gray-500;
}

.profiler-page__stat {
  @apply w-full flex flex-col divide-y divide-gray-300 dark:divide-gray-500;
}

.profiler-page__stat-board {
  @apply bg-gray-200 dark:bg-gray-800;
}

.profiler-page__stat-tabs {
  @apply p-5 bg-gray-200 flex-1 flex flex-col dark:bg-gray-800 dark:text-gray-300;
}

.profiler-page__stat-tabs .tabs-component-panel {
  @apply h-full;
}

.profiler-page__hover-edge {
  @apply absolute z-10 h-auto;
}
</style>
