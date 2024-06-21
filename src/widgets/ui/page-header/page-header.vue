<script lang="ts" setup>
type Props = {
  title?: string;
};

withDefaults(defineProps<Props>(), {
  title: "",
});
</script>

<template>
  <header class="page-header">
    <div class="page-header__title"><slot />&nbsp;</div>

    <div class="page-header__controls">
      <slot name="controls" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.page-header {
  @apply flex justify-between;
}

.page-header__title {
  @apply hidden sm:flex items-center flex-row;
  @apply text-2xs sm:text-sm md:text-base lg:text-lg;
}

.page-header__controls {
  @apply flex items-center flex-row;
  @apply text-right;
  @apply gap-2 sm:gap-3;
}

.page-header__btn-clear {
  @include button;
  @apply bg-red-800 hover:bg-red-700;
}
</style>
