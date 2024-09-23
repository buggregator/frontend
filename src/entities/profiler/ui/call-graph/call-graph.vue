<script lang="ts" setup>
import type { ElementsDefinition } from 'cytoscape';
import {
  ref, computed, onMounted, watchEffect,
} from 'vue';
import { type EventId, GraphTypes } from '@/shared/types';
import { IconSvg, type StatBoardCost } from '@/shared/ui';
import { useProfiler } from '../../lib';
import type { ProfilerCallGraph } from '../../types';
import { CallStatBoard } from '../call-stat-board';
import { RenderGraph } from '../render-graph';

type Props = {
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
const tools = ref<ProfilerCallGraph['toolbar']>([]);

const graphKey = ref('');

const setMetric = (value: string) => {
  if (Object.values(GraphTypes).includes(value as GraphTypes)) {
    metric.value = value as GraphTypes;
  } else {
    metric.value = GraphTypes.WALL_TIME;
  }
};

const setThreshold = (event: Event) => {
  threshold.value = Number((event.target as HTMLInputElement).value || 0);
};

const setMinPercent = (event: Event) => {
  percent.value = Number((event.target as HTMLInputElement).value || 0);
};

const toggleFullScreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const graphHeight = computed(() => isFullscreen.value
  ? window.innerHeight
  : (container.value as HTMLElement).offsetHeight);

watchEffect(async () => {
  const { toolbar, ...elems } = await getCallGraph(props.id, {
    threshold: String(threshold.value),
    percentage: String(percent.value),
    metric: String(metric.value),
  });

  elements.value = elems;
  tools.value = toolbar;

  graphKey.value = `${metric.value}-${threshold.value}-${percent.value}`;
});

onMounted(() => {
  // NOTE: need to show graph after parent render
  isReadyGraph.value = true;
});

const percentLabel = computed(() => (metric.value === GraphTypes.CALLS
  ? 'Min calls'
  : 'Percent'));

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
      <template #default="{ data }">
        <CallStatBoard
          v-if="data.cost"
          :title="data?.title || ''"
          :cost="data.cost as StatBoardCost"
        />
      </template>
    </RenderGraph>

    <div class="call-graph__toolbar">
      <button
        title="Full screen"
        @click="toggleFullScreen"
      >
        <IconSvg
          name="fullscreen"
          class="call-graph__toolbar-icon"
        />
      </button>

      <button
        v-for="tool in tools"
        :key="tool.metric"
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === tool.metric,
        }"
        :title="tool.description"
        @click="setMetric(tool.metric)"
      >
        {{ tool.label }}
      </button>
    </div>

    <div class="call-graph__toolbar call-graph__toolbar--right">
      <label
        v-if="metric !== GraphTypes.CALLS"
        class="call-graph__toolbar-input-wr"
      >
        Threshold

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="threshold"
          :min="0"
          :max="10"
          :step="0.1"
          @input="setThreshold"
        >
      </label>

      <label class="call-graph__toolbar-input-wr">
        {{ percentLabel }}

        <input
          class="call-graph__toolbar-input"
          type="number"
          :value="percent"
          :min="metric === GraphTypes.CALLS ? 1 : 0"
          :max="metric === GraphTypes.CALLS ? 1000 : 100"
          :step="metric === GraphTypes.CALLS ? 10 : 5"
          @input="setMinPercent"
        >
      </label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

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
