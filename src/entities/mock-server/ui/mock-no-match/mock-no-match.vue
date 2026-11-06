<template>
  <span class="mock-no-match"><span aria-hidden="true">×</span> no match</span>
</template>

<style lang="scss" scoped>
.mock-no-match {
  @apply inline-flex items-center gap-1 px-1.5 rounded text-2xs font-semibold leading-[18px];
  @apply text-red-700 dark:text-red-400 border border-dashed border-red-700 dark:border-red-400;
}
</style>
