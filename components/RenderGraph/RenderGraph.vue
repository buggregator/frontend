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

import cytoscape from "cytoscape";
import type { CytoscapeOptions } from "cytoscape";
// import StatBoard from "~/components/StatBoard/StatBoard.vue";

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

      elements: this.data.elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#3498db",
            label: "data(label)",
            content: "data(name)",
            "text-valign": "center",
            "text-outline-width": 2,
            "text-outline-color": "data(faveColor)",
            color: "#fff",
          },
        },
        {
          selector: "edge",
          style: {
            "line-color": "#e74c3c",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
          },
        },
        {
          selector: "edge.questionable",
          style: {
            "line-style": "dotted",
            "target-arrow-shape": "diamond",
          },
        },
      ],
    });

    this.renderer.on("mouseover", "node", (event) => {
      // console.log('node', node.data())

      this.activeEdgePosition = event.position;
    });

    this.renderer.on("mouseout", () => {
      this.activeEdgePosition = { x: 0, y: 0 };
    });
  },
  beforeUnmount() {
    this.renderer.destroy();
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
