<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { useProfiler } from '../../lib'
import type { StatBoardCost } from '../../types'

const { calcStatItems } = useProfiler()

type Props = {
  cost: StatBoardCost
}

const props = defineProps<Props>()
const statItems = computed(() => calcStatItems(props.cost))
</script>

<template>
  <section class="stat-board">
    <div
      v-for="item in statItems"
      :key="item.title"
      class="stat-board__item"
    >
      <h4 class="stat-board__item-name">
        {{ item.title }}

        <span
          v-if="item.percent && Number(item.percent) > 0"
          class="stat-board__item-percent"
        >
          {{ item.percent }}%
        </span>
      </h4>

      <strong class="stat-board__item-value">
        {{ item.value }}
      </strong>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.stat-board {
  @apply flex flex-col sm:flex-row;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700;
  @apply bg-gray-50 dark:bg-gray-900;
}

.stat-board__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
  @apply py-2 px-3 sm:py-3 sm:px-4;
}

.stat-board__item-name {
  @apply text-2xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate mb-0 sm:mb-0.5;
}

.stat-board__item-percent {
  @apply text-gray-400 dark:text-gray-500 ml-1;
}

.stat-board__item-value {
  @apply truncate font-mono;
  @apply text-xs sm:text-sm;
}
</style>
