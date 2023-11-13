<script lang="ts" setup>
import { computed, reactive } from "vue";
import type { CallStackHoverData } from "~/src/screens/profiler/types";
import type { Profiler } from "~/src/entities/profiler/types";
import { SORTING_ORDER, SortingWrapper } from "~/src/shared/ui";
import { CallStackRow as ProfilerPageCallStackRow } from "../call-stack-row";

type Props = {
  payload: Profiler;
};

type Emits = {
  hover: [value: CallStackHoverData];
  hide: [value: boolean];
};

const props = defineProps<Props>();
defineEmits<Emits>();

enum SortingKeys {
  CPU = "CPU",
  MEMORY = "memory",
  CALLS = "calls",
}

const sorting = reactive({
  [SortingKeys.CPU]: SORTING_ORDER.ASC,
  [SortingKeys.MEMORY]: SORTING_ORDER.DEFAULT,
  [SortingKeys.CALLS]: SORTING_ORDER.DEFAULT,
});

const sortedEdges = computed(() =>
  Object.entries(props.payload.edges)
    .sort(([, a], [, b]) => {
      if (sorting[SortingKeys.CPU] === SORTING_ORDER.ASC) {
        return b.cost.p_cpu - a.cost.p_cpu;
      }
      if (sorting[SortingKeys.CPU] === SORTING_ORDER.DESC) {
        return a.cost.p_cpu - b.cost.p_cpu;
      }
      if (sorting[SortingKeys.MEMORY] === SORTING_ORDER.ASC) {
        return b.cost.p_mu - a.cost.p_mu;
      }
      if (sorting[SortingKeys.MEMORY] === SORTING_ORDER.DESC) {
        return a.cost.p_mu - b.cost.p_mu;
      }
      if (sorting[SortingKeys.CALLS] === SORTING_ORDER.ASC) {
        return b.cost.ct - a.cost.ct;
      }
      if (sorting[SortingKeys.CALLS] === SORTING_ORDER.DESC) {
        return a.cost.ct - b.cost.ct;
      }

      return 0;
    })
    .reduce((res, [key, value]) => ({ ...res, [key]: value }), {})
);

const changeSortOrder = (key: SortingKeys) => (value: SORTING_ORDER) => {
  Object.keys(sorting).forEach((k) => {
    const sortKey = k as SortingKeys;
    if (sortKey !== key) {
      sorting[sortKey] = SORTING_ORDER.DEFAULT;
    } else {
      sorting[sortKey] =
        value === SORTING_ORDER.DEFAULT ? SORTING_ORDER.ASC : value;
    }
  });
};
</script>

<template>
  <div class="call-stack">
    <header class="call-stack__header">
      <div class="call-stack__header-cpu">
        <SortingWrapper
          :sort="sorting.CPU"
          @change-sort="(v) => changeSortOrder(SortingKeys.CPU)(v)"
        >
          CPU
        </SortingWrapper>
        /
        <SortingWrapper
          :sort="sorting.memory"
          @change-sort="(v) => changeSortOrder(SortingKeys.MEMORY)(v)"
        >
          memory
        </SortingWrapper>
      </div>

      <div class="call-stack__header-calls">
        <SortingWrapper
          :sort="sorting.calls"
          @change-sort="(v) => changeSortOrder(SortingKeys.CALLS)(v)"
        >
          Calls
        </SortingWrapper>
      </div>
    </header>

    <div class="call-stack__calls">
      <ProfilerPageCallStackRow
        v-for="(edge, key) in sortedEdges"
        :key="key"
        :edge="edge"
        @hover="$emit('hover', $event)"
        @hide="$emit('hide')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.call-stack {
}

.call-stack__header {
  @apply flex items-stretch bg-gray-400 dark:bg-gray-600 text-xs dark:text-white text-gray-800 text-center font-bold uppercase py-2;
}

.call-stack__header-cpu {
  @apply flex-1 dark:text-white text-gray-800;
}

.call-stack__header-calls {
  @apply w-16;
}

.call-stack__calls {
  @apply flex flex-col divide-y divide-gray-200 dark:divide-gray-600;
}
</style>
