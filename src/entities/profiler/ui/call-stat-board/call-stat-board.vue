<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { useProfiler } from '../../lib/use-profiler'
import type { StatBoardCost } from '../../types'

const { calcStatItems } = useProfiler()

type Props = {
  cost: StatBoardCost
  title: string
}

const props = defineProps<Props>()
const statItems = computed(() => calcStatItems(props.cost))
</script>

<template>
  <div class="call-stat-board">
    <h4 class="call-stat-board__title">
      {{ title }}
    </h4>

    <section class="stat-board">
      <div
        v-for="item in statItems"
        :key="item.title"
        class="stat-board__item"
      >
        <h4 class="stat-board__item-name">
          {{ item.title }}

          <span
            v-if="item.percent && item.percent > 0"
            class="stat-board__item-name-detail"
          >
            [{{ item.percent }}%]
          </span>
        </h4>

        <strong class="stat-board__item-value">
          {{ item.value }}
        </strong>
      </div>
    </section>
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

.stat-board {
  @apply flex flex-col sm:flex-row justify-between items-start;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-500;
  @apply bg-gray-200 dark:bg-gray-800;
  @apply sm:p-4 lg:p-6;
  @apply p-0 border-t border-t-gray-300 dark:border-t-gray-500;
}

.stat-board__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
  @apply px-4 py-2 sm:py-2 sm:px-2;
}

.stat-board__item-name {
  @apply text-2xs text-gray-600 dark:text-gray-300 font-bold uppercase truncate mb-0 sm:mb-0;
}

.stat-board__item-name-detail {
  @apply truncate ml-0 text-2xs;
}

.stat-board__item-value {
  @apply truncate;
  @apply text-2xs sm:text-xs md:text-xs;
}
</style>
