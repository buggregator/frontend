<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProfiler } from "~/src/entities/profiler";
import type {
  Profiler,
  ProfilerTopFunctions,
} from "~/src/entities/profiler/types";
import { formatDuration } from "~/src/shared/lib/formats/format-duration";
import { formatFileSize } from "~/src/shared/lib/formats/format-file-size";
import { type EventId } from "~/src/shared/types";
import { StatBoard } from "~/src/shared/ui";

type Props = {
  payload: Profiler;
  id: EventId;
};

const { getTopFunctions } = useProfiler();
const props = defineProps<Props>();
const metric = ref("excl_wt"); // TODO: use enum value

const data = ref<ProfilerTopFunctions>({
  functions: [],
  overall_totals: {},
  schema: [],
});

const setMetric = (value: string | undefined) => {
  if (value) {
    metric.value = value;
  }
};

const formatValue = (value: number, format: string) => {
  if (format === "ms") {
    return formatDuration(value);
  }

  if (format === "percent") {
    return `${value}%`;
  }

  if (format === "number") {
    return new Intl.NumberFormat("en-US", { style: "decimal" }).format(value);
  }

  if (format === "bytes") {
    return formatFileSize(value, 3);
  }

  return value;
};

onMounted(async () => {
  data.value = await getTopFunctions(props.id, { metric: metric.value });
});
</script>

<template>
  <section class="top-functions__stat-board">
    <StatBoard v-if="data.overall_totals" :cost="data.overall_totals" />
  </section>

  <div class="top-functions__body">
    <table class="top-functions__table">
      <thead>
        <tr>
          <td
            v-for="col in data.schema"
            :key="col.key"
            class="text-left"
            :class="`col-${col.key} ${metric === col.key ? 'selected' : ''}`"
            :title="col.description"
            @click="setMetric(col.sortable ? col.key : undefined)"
          >
            {{ col.label }}
          </td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="fn in data.functions" :key="fn">
          <td
            v-for="col in data.schema"
            :key="col.key"
            class="text-left"
            :class="`col-${col.key} ${metric === col.key ? 'selected' : ''}`"
          >
            <div
              v-for="value in col.values"
              :key="value.key"
              class="table-value"
              :class="`value-${value.format}`"
            >
              {{ formatValue(fn[value.key], value.format) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
@import "src/assets/mixins";

.top-functions__body {
  @include border-style;
  @apply overflow-auto mb-5 mt-2 rounded-md;
}

.top-functions__table {
  @apply w-full overflow-auto;
}

table {
  @apply w-full text-xs;
}

table thead {
  @apply bg-gray-300 dark:bg-gray-900 text-base;
}

td {
  @apply px-4;
}

td.selected {
  @apply border-x text-gray-800 dark:text-gray-100 border-gray-400 dark:border-gray-500;
}

thead td {
  @apply font-black py-3 text-gray-500 dark:text-gray-400 cursor-pointer;
  @apply py-2;
}

tbody tr {
  @apply dark:hover:bg-gray-900;

  &:nth-child(odd) {
    @apply dark:bg-gray-700 bg-gray-100;
  }
}

.table-value.value-percent {
  @apply text-xs text-gray-500;
}
</style>
