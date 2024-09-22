<script lang="ts" setup></script>

<template>
  <div class="table-base">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";
.table-base {
  @include border-style;
  @apply bg-gray-100 dark:bg-gray-800 text-sm divide-y;
}
</style>

<style lang="scss" scoped></style>
