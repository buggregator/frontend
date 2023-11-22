<script lang="ts" setup>
import { defineProps } from "vue";

type Props = {
  title?: string;
};

const props = withDefaults(defineProps<Props>(), {
  title: "",
});
</script>

<template>
  <div class="table-base-row">
    <div class="table-base-row__name">
      <span>{{ title }}</span>
    </div>
    <div class="table-base-row__value">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";
.table-base-row {
  @include text-responsive;
  @apply md:flex bg-gray-50 dark:bg-gray-800 md:space-y-1 py-1 md:py-2 px-2 md:px-4 items-center sm:divide-x divide-gray-300 dark:divide-gray-700;
}

.table-base-row__name {
  @apply font-bold mr-5 md:w-1/4 sm:pr-4;
}

.table-base-row__value {
  @apply break-all md:w-3/4 sm:pl-4;
}
</style>
