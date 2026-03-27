<script lang="ts" setup>
import moment from 'moment'
import { computed } from 'vue'
import type { InspectorTransaction } from '../../types'

type Props = {
  transaction: InspectorTransaction
}

const props = defineProps<Props>()

const processDate = computed(() => moment(props.transaction.timestamp).toLocaleString())
const processResult = computed(() => (props.transaction.result || 'success').toUpperCase())
</script>

<template>
  <section class="stat-board">
    <div class="stat-board__item">
      <h4 class="stat-board__item-name">
        Timestamp
      </h4>
      <strong class="stat-board__item-value">
        {{ processDate }}
      </strong>
    </div>

    <div class="stat-board__item">
      <h4 class="stat-board__item-name">
        Duration
      </h4>
      <strong class="stat-board__item-value">{{ transaction.duration }} ms</strong>
    </div>

    <div class="stat-board__item">
      <h4 class="stat-board__item-name">
        Result
      </h4>
      <span class="stat-board__item-value">{{ processResult }}</span>
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

.stat-board__item-value {
  @apply truncate font-mono;
  @apply text-xs sm:text-sm;
}
</style>
