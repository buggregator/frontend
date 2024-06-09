<script setup lang="ts">
import type { Profiler } from "~/src/entities/profiler/types";
import { ref } from "vue";
import { REST_API_URL } from "~/src/shared/lib/io";
import { TopFunctionsMetric } from "~/src/shared/types";
import { computedAsync } from "@vueuse/core";
import { formatFileSize } from "~/src/shared/lib/formats/format-file-size";
import { formatDuration } from "~/src/shared/lib/formats/format-duration";
import { StatBoard } from "~/src/shared/ui";

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

const formatValue = (value: number, format: string) => {
  if (format === "ms") {
    return formatDuration(value);
  }

  if (format === "percent") {
    return value + '%';
  }

  if (format === "number") {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(value);
  }

  if (format === "bytes") {
    return formatFileSize(value, 3);
  }

  return value;
};
</script>

<template>
  <section class="profiler-page__stat-board">
    <StatBoard v-if="data.overall_totals" :cost="data.overall_totals"/>
  </section>

  <div class="table-wrapper">
    <table>
      <thead>
      <tr>
        <th class="text-left"
            v-for="col in data.schema"
            :title="col.description"
            :class="{selected: metric === col.key,  [`col-${col.key}`]: true}"
            @click="(col.sortable || false) ? setMetric(col.key) : null"
        >
          {{ col.label }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="fn in data.functions">
        <td class="text-left" :class="{
        selected: metric === col.key,
      [`col-${col.key}`]: true
      }" v-for="col in data.schema">
          <div class="table-value" v-for="value in col.values" :class="{
          [`value-${value.format}`]: true,
        }">
            {{ formatValue(fn[value.key], value.format) }}
          </div>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-wrapper {
  @apply overflow-hidden mb-5 mt-2;
  @apply border rounded-md dark:border-gray-500
}

table td .table-value.value-percent {
  @apply text-xs text-gray-500;
}

table {
  @apply w-full text-xs;
}

table thead {
  @apply dark:bg-gray-900 bg-gray-300 text-base;
}

table th, td {
  @apply px-4;
}

table thead th {
  @apply font-black py-3 dark:text-gray-400 cursor-pointer;
}

table thead th.selected, table tbody td.selected {
  @apply dark:text-gray-100 border-l border-r dark:border-gray-500 font-semibold;
}

table tr .col-function {
  @apply pl-3 font-bold;
}

table tbody th, table tbody td {
  @apply py-2;
}

table tbody tr:nth-child(odd) {
  @apply dark:bg-gray-700 bg-gray-100;
}

table tbody tr {
  @apply dark:hover:bg-gray-900;
}
</style>
