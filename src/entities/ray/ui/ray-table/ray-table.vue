<script lang="ts" setup>
import { computed } from 'vue'
import type { RayContentObject } from '../../types'

type Props = {
  table: RayContentObject
}

const props = defineProps<Props>()

const entries = computed(() => Object.entries(props.table.values || {}))
const label = computed(() => props.table.label || '')
</script>

<template>
  <div class="ray-table">
    <div
      v-if="label"
      class="ray-table__label"
    >
      {{ label }}
    </div>
    <div class="ray-table__wrap">
      <table class="ray-table__table">
        <thead>
          <tr>
            <th class="ray-table__th">
              Key
            </th>
            <th class="ray-table__th">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="[key, value] in entries"
            :key="key"
            class="ray-table__row"
          >
            <td class="ray-table__td ray-table__td--key">
              {{ key }}
            </td>
            <td class="ray-table__td">
              {{ value ?? '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-table__label {
  @apply text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5;
}

.ray-table__wrap {
  @apply rounded overflow-hidden border border-gray-200 dark:border-gray-700;
}

.ray-table__table {
  @apply w-full text-xs;
}

.ray-table__th {
  @apply px-3 py-2 text-left text-2xs font-medium uppercase tracking-wide;
  @apply text-gray-500 dark:text-gray-400;
  @apply bg-gray-50 dark:bg-gray-900;
  @apply border-b border-gray-200 dark:border-gray-700;
}

.ray-table__row {
  @apply border-b border-gray-100 dark:border-gray-700/50;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors;

  &:last-child {
    @apply border-b-0;
  }
}

.ray-table__td {
  @apply px-3 py-1.5 font-mono text-gray-700 dark:text-gray-200;
}

.ray-table__td--key {
  @apply font-medium text-gray-500 dark:text-gray-400 font-sans;
  @apply w-1/4;
}
</style>
