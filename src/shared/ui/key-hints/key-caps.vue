<script lang="ts" setup>
type Props = {
  caps: string[]
}

defineProps<Props>()
</script>

<template>
  <span class="key-caps">
    <kbd
      v-for="cap in caps"
      :key="cap"
      class="key-caps__cap"
    >{{ cap }}</kbd>
  </span>
</template>

<style lang="scss" scoped>
.key-caps {
  @apply inline-flex items-center gap-0.5;
}

.key-caps__cap {
  @apply inline-flex items-center justify-center;
  @apply min-w-[1.25rem] h-[1.15rem] px-1 rounded;
  @apply font-mono leading-none;
  @apply bg-gray-100 dark:bg-gray-800;
  @apply text-gray-600 dark:text-gray-300;
  @apply border border-gray-200 dark:border-gray-600;
  font-size: 10px;
}
</style>
