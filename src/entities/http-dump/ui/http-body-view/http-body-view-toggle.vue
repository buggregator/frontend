<script lang="ts" setup>
type Props = {
  modes: string[]
  active: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:active': [value: string] }>()
</script>

<template>
  <div class="body-toggle">
    <button
      v-for="mode in modes"
      :key="mode"
      class="body-toggle__btn"
      :class="{ 'body-toggle__btn--active': active === mode }"
      @click="emit('update:active', mode)"
    >
      {{ mode }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.body-toggle {
  @apply flex items-center rounded overflow-hidden;
  @apply border border-gray-200 dark:border-gray-700;
}

.body-toggle__btn {
  @apply px-2 py-0.5 text-2xs font-medium cursor-pointer capitalize;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-700 dark:hover:text-gray-200;
  @apply transition-colors duration-150;

  &:not(:last-child) {
    @apply border-r border-gray-200 dark:border-gray-700;
  }
}

.body-toggle__btn--active {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200;
}
</style>
