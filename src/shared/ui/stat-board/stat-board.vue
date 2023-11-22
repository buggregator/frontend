<script lang="ts" setup>
import { computed, defineProps } from "vue";
import type { ProfilerCost } from "~/src/entities/profiler/types";
import { useFormats } from "../../lib/formats";

const { formatDuration, formatFileSize } = useFormats();

type Props = {
  cost: ProfilerCost;
};

const props = defineProps<Props>();

const statItems = computed(() => [
  {
    title: "Calls",
    value: props.cost.ct || 0,
    percent: null,
  },
  {
    title: "CPU time",
    value: formatDuration(props.cost.cpu || 0) || "—",
    percent: props.cost?.p_cpu,
  },
  {
    title: "Wall time",
    value: formatDuration(props.cost.wt || 0) || "—",
    percent: props.cost?.p_wt,
  },
  {
    title: "Memory usage",
    value: formatFileSize(props.cost.mu || 0) || "—",
    percent: props.cost?.p_mu,
  },
  {
    title: "Change memory",
    value: formatFileSize(props.cost.pmu || 0) || "—",
    percent: props.cost?.p_pmu,
  },
]);
</script>

<template>
  <section class="stat-board">
    <div v-for="item in statItems" :key="item.title" class="stat-board__item">
      <h4 class="stat-board__item-name">
        {{ item.title }}

        <span v-if="item.percent > 0" class="stat-board__item-name-detail">
          [{{ item.percent }}%]
        </span>
      </h4>

      <strong class="stat-board__item-value">
        {{ item.value }}
      </strong>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.stat-board {
  @apply flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-start;
  @apply sm:pt-5 sm:pb-4 sm:px-4 md:px-5;
  @apply bg-gray-200 dark:bg-gray-800;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-500;
}

.stat-board__item {
  @apply pl-3 sm:px-6 py-3;

  &:first-child {
    @apply sm:pl-0;
  }

  &:last-child {
    @apply sm:pr-0;
  }
}

.stat-board__item-name {
  @apply text-gray-600 dark:text-gray-300 font-bold text-2xs mb-1 uppercase truncate;
}

.stat-board__item-name-detail {
  @apply text-2xs truncate ml-1;
}

.stat-board__item-value {
  @apply text-2xs sm:text-xs md:text-base truncate;
}
</style>
