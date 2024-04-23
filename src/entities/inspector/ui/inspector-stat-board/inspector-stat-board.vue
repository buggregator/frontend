<script lang="ts" setup>
import moment from "moment";
import { defineProps, computed } from "vue";
import type { InspectorTransaction } from "../../types";

type Props = {
  transaction: InspectorTransaction;
};

const props = defineProps<Props>();

const processDate = computed(() =>
  moment(props.transaction.timestamp).toLocaleString()
);
const processResult = computed(() =>
  (props.transaction.result || "success").toUpperCase()
);
</script>

<template>
  <section class="inspector-stat-board">
    <div class="inspector-stat-board__item">
      <h4 class="inspector-stat-board__item-name">Timestamp</h4>
      <strong class="inspector-stat-board__item-value">
        {{ processDate }}
      </strong>
    </div>

    <div class="inspector-stat-board__item">
      <h4 class="inspector-stat-board__item-name">Duration</h4>
      <strong class="inspector-stat-board__item-value">
        {{ transaction.duration }} ms
      </strong>
    </div>

    <div class="inspector-stat-board__item">
      <h4 class="inspector-stat-board__item-name">Result</h4>
      <span class="inspector-stat-board__item-value">{{ processResult }}</span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.inspector-stat-board {
  @apply flex flex-col sm:flex-row justify-between items-start;
  @apply bg-gray-200 dark:bg-gray-800;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-500;
  @apply p-0 sm:p-4 lg:p-6;
}

.inspector-stat-board__item {
  @apply flex-auto flex flex-row justify-between sm:flex-col sm:justify-start;
  @apply w-full sm:w-auto;
  @apply py-2 px-2 sm:py-5 sm:px-5;
}

.inspector-stat-board__item-name {
  @apply text-gray-600 dark:text-gray-300 font-bold text-2xs uppercase truncate;
  @apply mb-0 sm:mb-1;
}

.inspector-stat-board__item-value {
  @apply text-2xs sm:text-xs md:text-base truncate dark:text-white;
}
</style>
