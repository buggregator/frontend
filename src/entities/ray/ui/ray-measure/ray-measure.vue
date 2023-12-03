<script lang="ts" setup>
import { computed } from "vue";
import { TableBase, TableBaseRow } from "~/src/shared/ui";
import type { RayContentMeasure } from "../../types";

type Props = {
  measure: RayContentMeasure;
};

const props = defineProps<Props>();

const convertMilliseconds = (milliseconds: number): string =>
  (milliseconds / 1000).toFixed(4);

const prettySize = (bytes: number, separator = "", postFix = ""): string => {
  if (!bytes) {
    return "n/a";
  }

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Number(parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))), 10)),
    sizes.length - 1
  );

  return `${(bytes / 1024 ** i).toFixed(2)}${separator} ${sizes[i]}${postFix}`;
};

const totalTime = computed(
  () => `${convertMilliseconds(props.measure.total_time)} s`
);
const timeSinceLastCall = computed(
  () => `${convertMilliseconds(props.measure.time_since_last_call)} s`
);
const maxMemoryUsage = computed(() =>
  prettySize(props.measure.max_memory_usage_during_total_time)
);
</script>

<template>
  <div class="ray-measure">
    <h3 v-if="measure.is_new_timer" class="ray-measure__title">
      Start measuring performance...
    </h3>

    <TableBase v-else>
      <TableBaseRow title="Total time">
        {{ totalTime }}
      </TableBaseRow>
      <TableBaseRow title="Time since last call">
        {{ timeSinceLastCall }}
      </TableBaseRow>
      <TableBaseRow title="Maximum memory usage">
        {{ maxMemoryUsage }}
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-measure__title {
  @apply font-bold;
}
</style>
