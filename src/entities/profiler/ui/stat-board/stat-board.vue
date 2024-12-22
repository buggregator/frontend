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
</template>

<style lang="scss" scoped>
.stat-board {
  @apply flex flex-col sm:flex-row justify-between items-start;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-500;
  @apply bg-gray-200 dark:bg-gray-800;
  @apply p-0 sm:p-4 lg:p-6;
}

.stat-board--small {
  @apply p-0 border-t border-t-gray-300 dark:border-t-gray-500;
}

.stat-board__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
  @apply py-2 px-2 sm:py-5 sm:px-5;
}

.stat-board__item-name {
  @apply text-2xs text-gray-600 dark:text-gray-300 font-bold uppercase truncate mb-0 sm:mb-1;
}

.stat-board__item-name-detail {
  @apply truncate ml-1 text-2xs;
}

.stat-board__item-value {
  @apply truncate;
  @apply text-2xs sm:text-xs md:text-base;
}
</style>
