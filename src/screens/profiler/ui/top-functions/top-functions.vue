<script setup lang="ts">
import type { Profiler } from "~/src/entities/profiler/types";
import { ref } from "vue";
import { REST_API_URL } from "~/src/shared/lib/io";
import { TopFunctionsMetric } from "~/src/shared/types";
import { computedAsync } from "@vueuse/core";

type Props = {
  payload: Profiler;
};

const props = defineProps<Props>();
const metric = ref(TopFunctionsMetric.EXCLUSIVE_WALL_TIME as TopFunctionsMetric);

const data = computedAsync(async () =>
    // TODO: move to api service
    await fetch(`${REST_API_URL}/api/profiler/${props.payload.profile_uuid}/top?metric=${metric.value}`).then((response) => response.json()),
  []
);

const setMetric = (value: TopFunctionsMetric) => {
  metric.value = value;
};
</script>

<template>
  <table class="w-full text-sm">
    <thead>
    <tr>
      <th class="text-left">Function</th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.CALLS}"
          @click="setMetric(TopFunctionsMetric.CALLS)">Calls
      </th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.CPU}"
          @click="setMetric(TopFunctionsMetric.CPU)">CPU
      </th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.EXCLUSIVE_CPU}"
          @click="setMetric(TopFunctionsMetric.EXCLUSIVE_CPU)">Excl CPU
      </th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.WALL_TIME}"
          @click="setMetric(TopFunctionsMetric.WALL_TIME)">Wall Time
      </th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.EXCLUSIVE_WALL_TIME}"
          @click="setMetric(TopFunctionsMetric.EXCLUSIVE_WALL_TIME)">Excl Wall Time
      </th>
      <th class="text-left" :class="{selected: metric === TopFunctionsMetric.MEMORY_CHANGE}"
          @click="setMetric(TopFunctionsMetric.MEMORY_CHANGE)">Mem usage
      </th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="fn in data.functions">
      <th class="text-left">{{ fn.function }}</th>
      <td class="text-left">{{ fn.ct }} <span class="label">{{ fn.p_ct }}%</span></td>
      <td class="text-left">{{ fn.cpu }} <span class="label">{{ fn.p_cpu }}%</span></td>
      <td class="text-left">{{ fn.excl_cpu }} <span class="label">{{ fn.p_excl_cpu }}%</span></td>
      <td class="text-left">{{ fn.wt }} <span class="label">{{ fn.p_wt }}%</span></td>
      <td class="text-left">{{ fn.excl_wt }} <span class="label">{{ fn.p_excl_wt }}%</span></td>
      <td class="text-left">{{ fn.mu }} <span class="label">{{ fn.p_mu }}%</span></td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.label {
  @apply text-xs text-gray-500;
}

table {
  @apply w-full mb-10 -mt-3;
}

table thead {
  @apply dark:bg-gray-900 bg-gray-300;
}

table thead th {
  @apply font-black py-3 dark:text-gray-400 cursor-pointer;
}

table thead th.selected {
  @apply dark:text-gray-100;
}

table tr th:first-child {
  @apply pl-3;
}

table tbody th, table tbody td {
  @apply py-2;
}

table tbody tr:nth-child(odd) {
  @apply dark:bg-gray-700 bg-gray-100;
}
</style>
