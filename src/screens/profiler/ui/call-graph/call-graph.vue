<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { RenderGraph } from "~/src/widgets/ui";
import type { Profiler } from "~/src/entities/profiler/types";
import { GraphTypes } from "~/src/shared/types";
import { IconSvg } from "~/src/shared/ui";
import { CallStatBoard } from "../call-stat-board";
import { REST_API_URL } from "~/src/shared/lib/io";

type Props = {
  payload: Profiler;
};

const props = defineProps<Props>();

const isFullscreen = ref(false);
const metric = ref(GraphTypes.CPU as GraphTypes);
const threshold = ref(1);
const percent = ref(10);
const isReadyGraph = ref(false);

const container = ref<HTMLElement>();

const graphElements = computed(async () =>
  // TODO: move to api service
  await fetch(`${REST_API_URL}/api/profiler/${props.payload.profile_uuid}/call-graph?threshold=${threshold.value}&percentage=${percent.value}&metric=${metric.value}`).then((response) => response.json())
);

const percentLabel = computed(() =>
  metric.value === GraphTypes.CALLS ? "Min calls" : "Percent"
);

const graphKey = computed(
  () => `${metric.value}-${threshold.value}-${percent.value}`
);

const graphHeight = computed(() =>
  isFullscreen.value
    ? window.innerHeight
    : (container.value as HTMLElement).offsetHeight
);

onMounted(() => {
  // NOTE: need to show graph after parent render
  isReadyGraph.value = true;
});

const setMetric = (value: GraphTypes) => {
  metric.value = value;
};

const setThreshold = (value: number) => {
  threshold.value = value;
};

const setMinPercent = (value: number) => {
  percent.value = value;
};
</script>

<template>
  <div
    ref="container"
    class="call-graph"
    :class="{ 'call-graph--fullscreen': isFullscreen }"
  >
    <RenderGraph
      v-if="isReadyGraph && graphKey"
      :key="graphKey"
      class="call-graph__graph"
      :elements="graphElements"
      :height="graphHeight"
    >
      <template #default="{ data: { name, cost } }">
        <CallStatBoard :edge="{ callee: name, caller: '', cost }"/>
      </template>
    </RenderGraph>

    <div class="call-graph__toolbar">
      <button title="Full screen" @click="isFullscreen = !isFullscreen">
        <IconSvg name="fullscreen" class="call-graph__toolbar-icon"/>
      </button>
      <button
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === GraphTypes.CPU,
        }"
        @click="setMetric(GraphTypes.CPU)"
      >
        CPU
      </button>
      <button
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === GraphTypes.WALL_TIME,
        }"
        @click="setMetric(GraphTypes.WALL_TIME)"
      >
        Wall time
      </button>
      <button
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active':
            metric === GraphTypes.MEMORY_CHANGE,
        }"
        @click="setMetric(GraphTypes.MEMORY_CHANGE)"
      >
        Memory change
      </button>
      <button
        class="call-graph__toolbar-action"
        :class="{
          'call-graph__toolbar-action--active': metric === GraphTypes.MEMORY,
        }"
        @click="setMetric(GraphTypes.MEMORY)"
      >
        Memory usage
      </button>

      <!--
      // TODO: Add support on backend
      <button
              class="call-graph__toolbar-action"
              :class="{
                'call-graph__toolbar-action--active': metric === GraphTypes.CALLS,
              }"
              @click="setMetric(GraphTypes.CALLS)"
            >
              Calls
      </button>
      -->
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
          @input="setThreshold($event.target.value)"
        />
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
          @input="setMinPercent($event.target.value)"
        />
      </label>
    </div>
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
