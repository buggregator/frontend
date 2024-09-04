<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import type { ProfilerCost } from '@/entities/profiler/types'
import { useFormats } from '../../lib/formats'

const { formatDuration, formatFileSize } = useFormats()

type Props = {
  cost: ProfilerCost
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const statItems = computed(() => [
  {
    title: 'Calls',
    value: props.cost.ct || 0,
    percent: null
  },
  {
    title: 'CPU time',
    value: formatDuration(props.cost.cpu || 0) || '—',
    percent: props.cost?.p_cpu
  },
  {
    title: 'Wall time',
    value: formatDuration(props.cost.wt || 0) || '—',
    percent: props.cost?.p_wt
  },
  {
    title: 'Memory usage',
    value: formatFileSize(props.cost.mu || 0, 3) || '—',
    percent: props.cost?.p_mu
  },
  {
    title: 'Peak memory usage',
    value: formatFileSize(props.cost.pmu || 0, 3) || '—',
    percent: props.cost?.p_pmu
  }
])
</script>

<template>
  <section class="stat-board" :class="[`size-${size}`]">
    <div v-for="item in statItems" :key="item.title" class="stat-board__item">
      <h4 class="stat-board__item-name">
        {{ item.title }}

        <span v-if="item.percent > 0" class="stat-board__item-name-detail">
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
@import 'src/assets/mixins';

.stat-board {
  @apply flex flex-col sm:flex-row justify-between items-start;
  @apply divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-500;
  @apply bg-gray-200 dark:bg-gray-800;
}

.stat-board__item {
  @apply flex flex-row justify-between sm:flex-col sm:justify-start flex-auto;
  @apply w-full sm:w-auto;
}

.stat-board__item-name {
  @apply text-gray-600 dark:text-gray-300 font-bold uppercase truncate;
}

.stat-board__item-name-detail,
.stat-board__item-value {
  @apply truncate;
}

.stat-board.size-md {
  @apply p-0 sm:p-4 lg:p-6;

  .stat-board__item-name-detail {
    @apply text-2xs ml-1;
  }

  .stat-board__item {
    @apply py-2 px-2 sm:py-5 sm:px-5;
  }

  .stat-board__item-name {
    @apply mb-0 sm:mb-1 text-2xs;
  }

  .stat-board__item-value {
    @apply text-2xs sm:text-xs md:text-base;
  }
}

.stat-board.size-sm {
  @apply p-0 border-t border-t-gray-300 dark:border-t-gray-500;

  .stat-board__item-name-detail {
    @apply text-2xs;
  }

  .stat-board__item {
    @apply px-4 py-2;
  }

  .stat-board__item-name {
    @apply text-2xs;
  }

  .stat-board__item-value {
    @apply text-xs;
  }
}
</style>
