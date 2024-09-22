<script lang="ts" setup></script>

<template>
  <header class="header">
    <div class="header__title">
      <slot />&nbsp;
    </div>

    <div class="header__controls">
      <slot name="controls" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
@import "../../../assets/mixins";

.header {
  @apply flex justify-between h-full;
}

.header__title {
  @apply hidden sm:flex items-center flex-row;
  @apply text-2xs sm:text-sm md:text-base lg:text-lg;
}

.header__controls {
  @apply flex items-center flex-row;
  @apply text-right;
  @apply gap-2 sm:gap-3;
}

.header__btn-clear {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
