<script lang="ts" setup>
// TODO: need to fix cytoscape console warnings
import type { ElementsDefinition, NodeSingular } from "cytoscape";
import {
  defineProps,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import { useCytoscape } from "~/src/shared/lib/cytoscape";

type Props = {
  elements: ElementsDefinition;
  height: number;
};

const props = defineProps<Props>();

const hoverNodeData = ref<unknown>();
const tooltipPosition = ref<{ top: string; left: string } | undefined>();
const destroyFn = ref();

const renderer = ref<HTMLElement>();
const parent = ref<HTMLElement>();
const tooltip = ref<HTMLElement>();

const onNodeHover = (target?: NodeSingular, event?: MouseEvent) => {
  if (!target || !event) {
    hoverNodeData.value = undefined;
    tooltipPosition.value = undefined;

    return;
  }

  hoverNodeData.value = target.data();

  const x = event.offsetX;
  const y = event.offsetY;

  const { clientHeight: height = 0, clientWidth: width = 0 } =
    tooltip.value as HTMLElement;
  const { offsetHeight: parentHeight = 0, offsetWidth: parentWidth = 0 } =
    parent.value as HTMLElement;

  let top = y;
  let left = x;

  if (width + x > parentWidth - 80) {
    const deltaX = width + x - parentWidth + 100;

    left -= deltaX;
  }

  if (height + y > parentHeight) {
    top = y - height;
  }

  tooltipPosition.value = {
    top: `${top + 20}px`,
    left: `${left}px`,
  };
};

const { initialize } = useCytoscape();

onMounted(() => {
  destroyFn.value = initialize({
    container: renderer.value as HTMLElement,
    elements: props.elements,
    onNodeHover,
  });
});

onBeforeUnmount(() => {
  destroyFn.value();
});
</script>

<template>
  <div ref="parent" class="render-graph" :style="{ height: `${height}px` }">
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
