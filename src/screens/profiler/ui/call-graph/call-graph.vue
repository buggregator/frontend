<script lang="ts" setup>
import type { ElementsDefinition } from "cytoscape";
import { ref, computed, onMounted, watchEffect } from "vue";
import { CallGraphToolbar } from "~/src/screens/profiler/ui/call-graph-toolbar";
import { RenderGraph } from "~/src/widgets/ui";
import { useProfiler } from "~/src/entities/profiler";
import type {
  Profiler,
  ProfilerCallGraph,
} from "~/src/entities/profiler/types";
import { type EventId, GraphTypes } from "~/src/shared/types";
import { CallStatBoard } from "../call-stat-board";

type Props = {
  payload: Profiler;
  id: EventId;
};

const { getCallGraph } = useProfiler();

const props = defineProps<Props>();
const isFullscreen = ref(false);
const metric = ref(GraphTypes.WALL_TIME as GraphTypes);
const threshold = ref(1);
const percent = ref(10);

const isReadyGraph = ref(false);
const container = ref<HTMLElement>();

const elements = ref<ElementsDefinition | undefined>();
const toolbar = ref<ProfilerCallGraph["toolbar"]>([]);

const graphKey = computed(
  () => `${metric.value}-${threshold.value}-${percent.value}`,
);

const setMetric = (value: GraphTypes) => {
  metric.value = value;
};

const setThreshold = (value: number) => {
  threshold.value = value;
};

const setMinPercent = (value: number) => {
  percent.value = value;
};

const graphHeight = computed(() =>
  isFullscreen.value
    ? window.innerHeight
    : (container.value as HTMLElement).offsetHeight,
);

watchEffect(async () => {
  const { toolbar: tools, ...elems } = await getCallGraph(props.id, {
    threshold: String(threshold.value),
    percentage: String(percent.value),
    metric: String(metric.value),
  });

  elements.value = elems;
  toolbar.value = tools;
});

onMounted(() => {
  // NOTE: need to show graph after parent render
  isReadyGraph.value = true;
});
</script>

<template>
  <div
    ref="container"
    class="call-graph"
    :class="{ 'call-graph--fullscreen': isFullscreen }"
  >
    <RenderGraph
      v-if="isReadyGraph && graphKey && elements"
      :key="graphKey"
      class="call-graph__graph"
      :elements="elements"
      :height="graphHeight"
    >
      <template #default="{ data: { name, cost } }">
        <CallStatBoard :edge="{ callee: name, caller: '', cost }" />
      </template>
    </RenderGraph>

    <CallGraphToolbar
      :toolbar="toolbar"
      :metric="metric"
      :threshold="threshold"
      :percent="percent"
      :is-fullscreen="isFullscreen"
      @on-metric-change="setMetric"
      @on-threshold-change="setThreshold"
      @on-percent-change="setMinPercent"
      @on-fullscreen="isFullscreen = !isFullscreen"
    />
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.call-graph {
  @apply relative flex rounded min-h-min min-w-min h-full bg-white -mt-3 pt-3 dark:bg-gray-800;
}

.call-graph__graph {
  @apply w-full h-full flex;
}

.call-graph--fullscreen {
  @apply rounded-none mt-0 top-0 left-0 fixed w-full h-full bg-gray-800 z-[99999];
}

.call-graph__toolbar {
  @apply absolute top-5 left-5 flex bg-gray-200 p-2 rounded gap-x-5 shadow-lg;
}

.call-graph__toolbar--right {
  @apply right-5 left-auto py-1;
}

.call-graph__toolbar-icon {
  @apply w-4 h-4 fill-blue-500;
}

.call-graph__toolbar-action {
  @apply text-xs uppercase text-gray-600;
}

.call-graph__toolbar-action--active {
  @apply font-bold;
}

.call-graph__toolbar-input-wr {
  @apply text-xs uppercase text-gray-600;
}

.call-graph__toolbar-input {
  @apply border-gray-600 text-gray-600 w-10 font-bold text-right bg-gray-300 ml-1 py-1 rounded;
}
</style>
