<template>
  <section class="stat-board">
    <div v-for="item in statItems" :key="item.title" class="stat-board__item">
      <h4 class="stat-board__item-name">
        {{ item.title }}

        <span class="stat-board__item-percent" v-if="item.percent > 0">
          [{{ item.percent }}%]
        </span>
      </h4>

      <strong class="stat-board__item-value">
        {{ item.value }}
      </strong>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue";
import {ProfilerCost} from "~/config/types";
import {humanFileSize, formatDuration} from "~/utils/formats";

export default defineComponent({
  props: {
    cost: {
      type: Object as PropType<ProfilerCost>,
      required: true,
    },
  },
  computed: {
    statItems() {

      const undef = '—';

      let cpu = formatDuration(this.cost.cpu || 0) || undef;
      let wt = formatDuration(this.cost.wt || 0) || undef;
      let mu = humanFileSize(this.cost.mu || 0) || undef;
      let pmu = humanFileSize(this.cost.pmu || 0) || undef;

      return [
        {
          title: "Calls",
          value: this.cost.ct || 0,
          percent: null,
        },
        {
          title: "CPU time",
          value: cpu,
          percent: this.cost?.p_cpu,
        },
        {
          title: "Wall time",
          value: wt,
          percent: this.cost?.p_wt,
        },
        {
          title: "Memory usage",
          value: mu,
          percent: this.cost?.p_mu,
        },
        {
          title: "Change memory",
          value: pmu,
          percent: this.cost?.p_pmu,
        },
      ];
    },
  },
});
</script>

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

.stat-board__item-value {
  @apply text-2xs sm:text-xs md:text-base truncate;
}

.stat-board__item-percent {
  @apply text-2xs truncate ml-1;
}
</style>
