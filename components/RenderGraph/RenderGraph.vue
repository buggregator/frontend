<template>
  <div ref="parent" class="render-graph" :height="`${height}px`">
    <div ref="renderer" class="render-graph__in"></div>
  </div>

  <div
    v-if="activeEdgePosition"
    class="render-graph__tooltip"
    :style="edgePosition"
  >
    <h4 class="render-graph__tooltip-title">{{ activeEdge }} Hello works!</h4>

    <!--    <StatBoard v-if="activeEdge" :cost="activeEdge.cost" />-->
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { ProfilerEdge } from "~/config/types";

import cytoscape, { NodePositionFunction, NodePositionMap } from "cytoscape";
import type { CytoscapeOptions } from "cytoscape";
import dagre from "cytoscape-dagre";
// import StatBoard from "~/components/StatBoard/StatBoard.vue";
cytoscape.use(dagre);

export default defineComponent({
  // components: { StatBoard },
  props: {
    data: {
      type: Object as PropType<CytoscapeOptions["data"]>,
      required: true,
    },
    height: {
      type: Number,
      default: 500,
    },
  },
  data() {
    return {
      activeEdge: null as null | ProfilerEdge,
      activeEdgePosition: null as null | { x: number; y: number },
      renderer: null,
    };
  },
  computed: {
    edgePosition() {
      if (!this.activeEdgePosition?.x && !this.activeEdgePosition?.y) {
        return {};
      }

      let top = this.activeEdgePosition.y;
      let left = this.activeEdgePosition.x;

      if (this.activeEdgePosition.x > window.innerWidth - 80) {
        const deltaX = this.activeEdgePosition.x - window.innerWidth + 100;
        left -= deltaX;
      }

      if (this.activeEdgePosition.y > window.innerHeight) {
        top = this.activeEdgePosition.y;
      }

      return {
        top: `${top + 10}px`,
        left: `${left}px`,
      };
    },
  },
  mounted() {
    this.renderer = cytoscape({
      container: this.$refs.renderer as HTMLElement,

      elements: this.data!.elements,
      boxSelectionEnabled: false,
      autounselectify: true,
      layout: {
        name: "dagre",
        nodeSep: 100,
        edgeSep: 100,
        rankSep: 100,
        rankDir: "TB",
      },
      edge: {},
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#e74c3c",
            label: "data(label)",
            content: "data(name)",
            "text-valign": "center",
            "text-outline-width": 0,
            color: "#fff",
            shape: "round-rectangle",
            "padding-top": "10px",
            "padding-left": "10px",
            "padding-right": "10px",
            "padding-bottom": "10px",
            "text-wrap": "wrap",
            width: "label",
            height: "label",
            "border-width": "1px",
            "border-color": "#333",
          },
        },
        {
          selector: "edge",

          style: {
            "line-color": "#e74c3c",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#e74c3c",
            label: "data(label)",
            width: 1.5,
            "curve-style": "bezier",
            "loop-direction": "90deg",
          },
        },
      ],
    });

    this.renderer?.on("mouseover", "node", (event) => {
      this.activeEdgePosition = event.position;
    });

    this.renderer?.on("mouseout", () => {
      this.activeEdgePosition = null;
    });
  },
  beforeUnmount() {
    this.renderer?.destroy();
  },
});
</script>

<style scoped lang="scss">
.render-graph {
  @apply w-full h-full relative min-h-[500px];
}

.render-graph__in {
  @apply absolute top-0 left-0 right-0 bottom-0;
}

.render-graph__edge {
  @apply bg-gray-800 absolute border border-gray-300 dark:border-gray-600 z-50;

  width: 150px;
  height: 80px;
}

.render-graph__tooltip {
  @apply bg-gray-800 absolute border border-gray-300 dark:border-gray-600 z-50;
}

.render-graph__tooltip-title {
  @apply px-4 py-2 font-bold truncate text-gray-300;
}
</style>
