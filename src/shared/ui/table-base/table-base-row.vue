<script lang="ts" setup>
type Props = {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: ''
})
</script>

<template>
  <div class="table-row">
    <div class="table-row__name">
      <span :title="title">{{ title }}</span>
    </div>
    <div class="table-row__value">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-row {
  @apply flex flex-col md:flex-row md:items-center;
  @apply py-1.5 px-3 text-xs;
  @apply bg-white dark:bg-gray-800;

  &:nth-child(even) {
    @apply bg-gray-50 dark:bg-gray-800/50;
  }
}

.table-row__name {
  @apply font-medium text-gray-500 dark:text-gray-400;
  @apply md:w-1/4 md:pr-3 truncate flex-shrink-0;
  @apply md:border-r md:border-gray-200 md:dark:border-gray-700;
}

.table-row__value {
  @apply break-all md:w-3/4 md:pl-3 font-mono text-gray-700 dark:text-gray-200;
}
</style>
