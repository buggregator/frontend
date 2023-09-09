<template>
  <div
    class="profiler-page-call-graph"
    :class="{ 'profiler-page-call-graph--fullscreen': isFullscreen }"
  >
    <div v-if="metricLoading" class="profiler-page-call-graph__loading-wr">
      <div class="profiler-page-call-graph__loading">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>

    <div ref="graphviz" class="profiler-page-call-graph__graphviz"></div>

    <div class="profiler-page-call-graph__toolbar">
      <button title="Full screen" @click="isFullscreen = !isFullscreen">
        <IconSvg
          name="fullscreen"
          class="profiler-page-call-graph__toolbar-icon"
        />
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === 'cpu' }"
        @click="setMetric('cpu')"
      >
        CPU
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === 'pmu' }"
        @click="setMetric('pmu')"
      >
        Memory change
      </button>
      <button
        class="profiler-page-call-graph__toolbar-action"
        :class="{ 'font-bold': metric === 'mu' }"
        @click="setMetric('mu')"
      >
        Memory usage
      </button>
    </div>

    <div
      class="profiler-page-call-graph__toolbar profiler-page-call-graph__toolbar--right"
    >
      <label class="profiler-page-call-graph__toolbar-input-wr">
        Threshold:

        <input
          class="profiler-page-call-graph__toolbar-input"
          type="number"
          :value="threshold"
          :min="0"
          :max="100"
          @input="setThreshold($event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { selectAll } from "d3-selection";
import { graphviz } from "d3-graphviz";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

import IconSvg from "~/components/IconSvg/IconSvg.vue";

import { defineComponent, PropType } from "vue";
import { Profiler, ProfilerEdge } from "~/config/types";
import { addSlashes, DigraphBuilder } from "~/utils/digraph-builder";
import debounce from "lodash.debounce";
import destroy from "d3-graphviz/src/destroy";

export default defineComponent({
  components: { IconSvg },
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
      metric: "cpu",
      metricLoading: false,
      threshold: 1,
    };
  },
  created(): void {
    Graphviz.load().then(() => {
      this.graph = graphviz(this.$refs.graphviz, {})
        .width("100%")
        .height("100%")
        .fit(true);

      this.renderGraph();
    });
  },
  beforeUnmount() {
    this.graph.destroy();
  },
  methods: {
    setMetric(metric: string): void {
      this.metricLoading = true;

      setTimeout(() => {
        this.metric = metric;
        this.renderGraph();
        this.metricLoading = false;
      }, 0);
    },
    setThreshold(threshold: number): void {
      this.metricLoading = true;

      const prevThreshold = this.threshold;
      this.threshold = threshold;

      return debounce(() => {
        if (!threshold || prevThreshold === threshold) {
          return;
        }

        setTimeout(() => {
          this.renderGraph();
          this.metricLoading = false;
        }, 0);
      }, 1000)();
    },

    findEdge(name: string): ProfilerEdge | null {
      const found = Object.values(this.event.edges).filter(
        (v) => addSlashes(v.callee) === name
      );

      if (!found || found.length === 0) {
        return null;
      }

      return found[0] || null;
    },
    nodeHandler(): void {
      selectAll("g.node")
        .on("mouseover", (e, tag) => {
          const edge = this.findEdge(tag.key);

          if (!edge) {
            return;
          }

          this.$emit("hover", {
            name: edge.callee,
            cost: edge.cost,
            position: {
              x: e.pageX,
              y: e.pageY,
            },
          });
        })
        .on("mouseout", () => {
          this.$emit("hide");
        });
    },
    renderGraph(): void {
      this.graph
        .renderDot(
          new DigraphBuilder(this.event.edges).build(
            this.metric,
            this.threshold
          ),
          this.nodeHandler
        )
        .resetZoom();
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.profiler-page-call-graph {
  @apply relative flex rounded border border-gray-900 h-full;
}

.profiler-page-call-graph--fullscreen {
  @apply rounded-none mt-0 top-0 left-0 fixed w-full h-full;
  z-index: 9998;
}

.profiler-page-call-graph__toolbar {
  @apply absolute top-5 left-5 flex bg-gray-200 p-2 rounded gap-x-5;
  z-index: 9999;
}

.profiler-page-call-graph__toolbar--right {
  @apply right-5 left-auto;
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
  @apply border-b bg-transparent border-gray-600 text-gray-600 w-8;
}

.profiler-page-call-graph__loading-wr {
  @apply absolute m-auto top-0 left-0 right-0 bottom-0 flex justify-center items-center;
}

.profiler-page-call-graph__loading {
  @apply z-50;

  @include loading;
}

.profiler-page-call-graph__graphviz {
  @apply flex-1 justify-items-stretch items-stretch bg-white;

  max-height: 100vh;
}
</style>
