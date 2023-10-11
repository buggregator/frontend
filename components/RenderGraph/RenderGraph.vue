<template>
  <div ref="parent" class="render-graph" :height="`${height}px`">
    <div ref="renderer" class="render-graph__in"></div>
  </div>

  <div
    ref="tooltip"
    class="render-graph__tooltip"
    :class="{ 'render-graph__tooltip--active': hoverNodeData }"
    :style="tooltipPosition"
  >
    <div v-if="hoverNodeData">
      <slot :data="hoverNodeData">
        <h4 class="render-graph__tooltip-title">
          {{ hoverNodeData }}
        </h4>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

import cytoscape, { Stylesheet } from "cytoscape";
import type {
  CytoscapeOptions,
  EventObjectNode,
  Core as Cytoscape,
} from "cytoscape";
import dagre, { DagreLayoutOptions } from "cytoscape-dagre";

cytoscape.use(dagre);

const stylesConfig: Stylesheet[] = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      content: "data(name)",
      "text-valign": "center",
      "text-outline-width": 0,
      color: "data(textColor)",
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
      "line-color": "data(color)",
      "background-color": "data(color)",
      "text-outline-width": "5px",
      width: 1.5,
      height: "label",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "data(color)",
      content: "data(label)",
      color: "#fff",
      "curve-style": "bezier",
      "loop-direction": "90deg",
    },
  },
];

export default defineComponent({
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
      hoverNodeData: null,
      tooltipPosition: null as { top: string; left: string } | null,
      renderer: null as Cytoscape | null,
    };
  },
  mounted() {
    const cy: Cytoscape = cytoscape({
      container: this.$refs.renderer as HTMLElement,
      elements: this.data!.elements,
      layout: {
        name: "dagre",
        nodeSep: 10,
        edgeSep: 10,
        rankSep: 50,
        rankDir: "TB",
      } as DagreLayoutOptions,
      style: stylesConfig,
    });

    cy.on("mouseover", "node", (event: EventObjectNode) => {
      this.hoverNodeData = event.target.data();
      this.calcTooltipPosition(
        event.originalEvent.pageX,
        event.originalEvent.pageY
      );
    });

    cy.on("mouseout", "node", () => {
      this.hoverNodeData = null;
    });

    cy.nodes().ungrabify();

    this.renderer = cy;
  },
  beforeUnmount() {
    this.renderer?.destroy();
  },
  methods: {
    calcTooltipPosition(x: number, y: number) {
      const { clientHeight: height = 0, clientWidth: width = 0 } = this.$refs
        .tooltip as HTMLElement;

      let top = y;
      let left = x;

      if (width + x > window.innerWidth - 80) {
        const deltaX = width + x - window.innerWidth + 100;
        left -= deltaX;
      }

      if (height + y > window.innerHeight) {
        top = y - height;
      }

      this.tooltipPosition = {
        top: `${top + 20}px`,
        left: `${left}px`,
      };
    },
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

.render-graph__tooltip {
  @apply bg-gray-800 absolute z-50 opacity-0 flex w-[500px];
}

.render-graph__tooltip--active {
  @apply opacity-100;
}

.render-graph__tooltip-title {
  @apply px-4 py-2 font-bold text-gray-300;
}
</style>
