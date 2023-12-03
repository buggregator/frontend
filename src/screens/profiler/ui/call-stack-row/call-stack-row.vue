<script lang="ts" setup>
import { computed } from "vue";
import type { ProfilerEdge } from "~/src/entities/profiler/types";
import type { CallStackHoverData } from "~/src/screens/profiler/types";

type Props = {
  edge: ProfilerEdge;
};

type Emits = {
  hover: [value: CallStackHoverData];
  hide: [];
};

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const onHover = ($event: MouseEvent, edge: ProfilerEdge) => {
  emit("hover", {
    callee: edge.callee,
    cost: edge.cost,
    caller: edge.caller,
    position: {
      x: $event.pageX,
      y: $event.pageY,
    },
  });
};

const normalizeValue = (value: number) => Math.min(100, Math.max(0, value));

const cpuStyle = computed(() => ({
  width: `${normalizeValue(props.edge.cost.p_cpu)}%`,
}));

const memoryStyle = computed(() => ({
  width: `${normalizeValue(props.edge.cost.p_mu)}%`,
}));
</script>

<template>
  <div
    class="call-stack-row"
    @mouseover="onHover($event, edge)"
    @mouseout="$emit('hide')"
  >
    <div class="call-stack-row__usage">
      <div class="call-stack-row__usage-cpu" :style="cpuStyle" />
      <div class="call-stack-row__usage-memory" :style="memoryStyle" />
      <div class="call-stack-row__usage-title">
        {{ edge.cost.p_cpu }}% / {{ edge.cost.p_mu }}%
      </div>
    </div>
    <div class="call-stack-row__calls">{{ edge.cost.ct }}</div>
  </div>
</template>

<style lang="scss" scoped>
.call-stack-row {
  @apply flex items-stretch hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer divide-x divide-gray-200 dark:divide-gray-600;
}

.call-stack-row__calls {
  @apply w-16 text-center text-xs py-1;
}

.call-stack-row__usage {
  @apply flex-1 text-center text-xs relative;
}

.call-stack-row__usage-cpu {
  @apply h-full bg-red-900 text-sm opacity-60;
}

.call-stack-row__usage-memory {
  @apply h-full bg-purple-800 text-sm opacity-40 -mt-6;
}

.call-stack-row__usage-title {
  @apply absolute inset-0 py-1 text-blue-900 dark:text-gray-200 font-bold;
}
</style>
