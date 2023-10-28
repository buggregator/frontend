<template>
  <div
    ref="container"
    class="profiler-page-call-graph"
    :class="{ 'profiler-page-call-graph--fullscreen': isFullscreen }"
  >
    <RenderGraph
      v-if="isReadyGraph && graphKey"
      :key="graphKey"
      class="profiler-page-call-graph__graph"
      :elements="graphElements"
      :height="graphHeight"
    >
      <template #default="{ data: { name, cost } }">
        <div class="profiler-page-call-graph__board">
          <h4 class="profiler-page-call-graph__board-title">
            {{ name }}
          </h4>

          <StatBoard :cost="cost" />
        </div>
      </template>
    </RenderGraph>

    <div class="profiler-page-call-graph__toolbar">
      <button title="Full screen" @click="isFullscreen = !isFullscreen">
        <IconSvg
          name="fullscreen"
          class="profiler-page-call-graph__toolbar-icon"
        />
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === graphMetrics.CPU }"
        @click="setMetric(graphMetrics.CPU)"
      >
        CPU
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === graphMetrics.MEMORY_CHANGE }"
        @click="setMetric(graphMetrics.MEMORY_CHANGE)"
      >
        Memory change
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === graphMetrics.MEMORY }"
        @click="setMetric(graphMetrics.MEMORY)"
      >
        Memory usage
      </button>
    </div>

    <div
      class="profiler-page-call-graph__toolbar profiler-page-call-graph__toolbar--right"
    >
      <label class="profiler-page-call-graph__toolbar-input-wr">
        Threshold

        <input
          class="profiler-page-call-graph__toolbar-input"
          type="number"
          :value="threshold"
          :min="0"
          :max="10"
          :step="0.1"
          @input="setThreshold($event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { GraphTypes, Profiler } from "~/config/types";
import { IconSvg } from "~/src/shared/ui";
import { RenderGraph, StatBoard } from "~/src/widgets/ui";
import { useCytoscape } from "~/src/shared/lib/cytoscape";

// TODO: move buildData to renderGraph context instead of cytoscape context.
const { buildData } = useCytoscape();

export default defineComponent({
  components: { StatBoard, RenderGraph, IconSvg },
  props: {
    event: {
      type: Object as PropType<Profiler>,
      required: true,
    },
  },
  emits: ["hover", "hide"],
  data() {
    return {
      isFullscreen: false,
      metric: GraphTypes.CPU as GraphTypes,
      threshold: 1,
      isReadyGraph: false,
    };
  },
  computed: {
    graphElements() {
      return buildData(this.event.edges, this.metric, this.threshold);
    },
    graphKey() {
      return `${this.metric}-${this.threshold}`;
    },
    graphMetrics() {
      return GraphTypes;
    },
    graphHeight() {
      return this.isFullscreen
        ? window.innerHeight
        : (this.$refs.container as HTMLElement).offsetHeight;
    },
  },
  mounted() {
    // NOTE: need to show graph after parent render
    this.setReadyGraph();
  },
  methods: {
    setMetric(metric: GraphTypes): void {
      this.metric = metric;
    },
    setThreshold(threshold: number): void {
      this.threshold = threshold;
    },
    setReadyGraph(): void {
      this.isReadyGraph = true;
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.profiler-page-call-graph {
  @apply relative flex rounded border border-gray-900 min-h-min min-w-min h-full;
}

.profiler-page-call-graph__graph {
  @apply w-full h-full flex;
}

.profiler-page-call-graph--fullscreen {
  @apply rounded-none mt-0 top-0 left-0 fixed w-full h-full bg-gray-800 z-[99999];
}

.profiler-page-call-graph__board {
  @apply border border-gray-600 bg-gray-800 h-full;
}

.profiler-page-call-graph__board-title {
  @apply px-4 py-2 font-bold truncate text-gray-300;
}

.profiler-page-call-graph__toolbar {
  @apply absolute top-5 left-5 flex bg-gray-200 p-2 rounded gap-x-5 shadow-lg;
}

.profiler-page-call-graph__toolbar--right {
  @apply right-5 left-auto py-1;
}

.profiler-page-call-graph__toolbar-icon {
  @apply w-4 h-4 fill-blue-500;
}

.profiler-page-call-graph__toolbar-action {
  @apply text-xs uppercase text-gray-600;
}

.profiler-page-call-graph__toolbar-input-wr {
  @apply text-xs uppercase text-gray-600;
}

.profiler-page-call-graph__toolbar-input {
  @apply border-gray-600 text-gray-600 w-10 font-bold text-right bg-gray-300 ml-1 py-1 rounded;
}
</style>
