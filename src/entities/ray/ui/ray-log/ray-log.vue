<script lang="ts" setup>
import { computed } from 'vue'
import { CodeSnippet } from '@/shared/ui'

type Props = {
  log: string | number
}

const props = defineProps<Props>()

const isEmpty = computed(() => props.log === '')
const isVisible = computed(() => props.log !== undefined && props.log !== null)
</script>

<template>
  <span v-if="isVisible">
    <span
      v-if="isEmpty"
      class="ray-log-empty"
    >empty string</span>
    <CodeSnippet
      v-else
      :code="String(log)"
    />
  </span>
</template>

<style lang="scss" scoped>
.ray-log-empty {
  @apply text-xs italic text-gray-400 dark:text-gray-500;
}
</style>
