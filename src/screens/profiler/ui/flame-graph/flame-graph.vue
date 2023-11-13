<script lang="ts" setup>
import { FlameChart } from "flame-chart-js";
import debounce from "lodash.debounce";
import { ref, onMounted, nextTick } from "vue";
import { CallStackHoverData } from "~/src/screens/profiler/types";
import { useFlameChart } from "~/src/features/lib/flame-chart";
import { ProfilerEdges } from "~/src/entities/profiler/types";
import { GraphTypes } from "~/src/shared/types";

type Props = {
  edges: ProfilerEdges;
};

type Emits = {
  hover: [value: CallStackHoverData];
  hide: [];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const canvas = ref<HTMLCanvasElement>();
const graph = ref<HTMLCanvasElement>();

const { build } = useFlameChart();

const renderChart = () => {
  if (!graph.value || !canvas.value) {
    return;
  }

  const { width, height } = graph.value.getBoundingClientRect();

  canvas.value.width = width || 1;
  canvas.value.height = height || 1;

  const flameChart = new FlameChart({
    canvas: canvas.value,
    data: [build(props.edges, GraphTypes.CPU)],
    settings: {
      styles: {
        main: {
          blockHeight: 20,
        },
      },
      options: {
        tooltip: (data, _, mouse) => {
          if (data === null) {
            emit("hide");
          } else {
            emit("hover", {
              callee: data.data.source.name,
              caller: "",
              cost: data.data.source.cost,
              position: {
                x: mouse?.x || 0,
                y: mouse?.y || 0,
              },
            });
          }
        },
      },
    },
  });

  flameChart.render();
  window.addEventListener(
    "resize",
    debounce(() => {
      if (!graph.value) {
        return;
      }

      const { width: windowWidth, height: windowHeight } =
        graph.value.getBoundingClientRect();

      flameChart.resize(windowWidth, windowHeight);
    }, 30)
  );
};

onMounted(() => {
  nextTick(() => {
    renderChart();
  });
});
</script>

<template>
  <div ref="graph" class="flame-graph">
    <canvas ref="canvas" class="flame-graph__canvas"></canvas>
  </div>
</template>

<style lang="scss" scoped>
.flame-graph {
  @apply w-full h-full relative min-h-[500px];
}

.flame-graph__canvas {
  @apply bg-gray-300 w-full h-full px-5;
}
</style>
