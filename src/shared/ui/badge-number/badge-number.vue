<script lang="ts" setup>
import { computed } from 'vue'

type Props = {
  number: number
  isVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true
})

const normalizedNumber = computed(() => (props.number > 99 ? '*' : props.number))
const isVisibleBadge = computed(() => props.number > 0 && props.isVisible)
</script>

<template>
  <div class="badge-number">
    <slot />

    <div v-if="isVisibleBadge" class="badge-number__badge">
      {{ normalizedNumber }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.badge-number {
  @apply relative inline-flex;
}

.badge-number__badge {
  @apply bg-red-700 dark:bg-red-800 text-white shadow-lg ring-1 dark:ring-gray-800 ring-gray-300;
  @apply flex justify-center items-center;
  @apply absolute rounded-full font-thin leading-none;
  @apply sm:-right-2 sm:-top-2 -right-1 -top-1 sm:w-4 sm:h-4 w-3 h-3 sm:text-[10px] text-[8px];
}
</style>
