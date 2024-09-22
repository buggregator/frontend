<script lang="ts" setup>
import { defineProps } from "vue";
import { StatBoard, type StatBoardCost, StatBoardSize } from "@/shared/ui";

type Props = {
  cost: StatBoardCost;
  title: string;
};

defineProps<Props>();
</script>

<template>
  <div class="call-stat-board">
    <h4 class="call-stat-board__title">
      {{ title }}
    </h4>

    <StatBoard
      class="call-stat-board__body"
      :cost="cost"
      :size="StatBoardSize.Small"
    />
  </div>
</template>

<style lang="scss" scoped>
.call-stat-board {
  @apply border border-gray-600 bg-gray-800;
}

.call-stat-board__title {
  @apply p-2 text-xs font-bold truncate text-gray-300;
}

.call-stat-board__body {
  @apply pt-0;
}
</style>
