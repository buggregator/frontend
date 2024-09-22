<script lang="ts" setup>
import { storeToRefs } from "pinia"
import { watch } from "vue"
import { useEvents } from "@/shared/lib/use-events"
import { useEventsStore } from "@/shared/stores"

const { activeProjectKey } = storeToRefs(useEventsStore())
const { events } = useEvents()

watch(
  () => activeProjectKey.value,
  () => {
    events.getAll()
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="layout-base"
    :class="{
      'layout-base--no-sidebar': !$slots.sidebar,
      'layout-base--no-header': !$slots.header
    }"
  >
    <div
      v-if="$slots.sidebar"
      class="layout-base__sidebar"
    >
      <slot name="sidebar" />
    </div>

    <div
      v-if="$slots.header"
      class="layout-base__header"
    >
      <slot name="header" />
    </div>

    <div class="layout-base__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.layout-base {
  @apply flex min-h-screen items-stretch relative;
}

.layout-base__sidebar {
  @apply w-10 md:w-14 lg:w-16 flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
  @include layout-sidebar;
}

.layout-base__header {
  @include layout-head;

  .layout-base--no-sidebar & {
    @apply left-0;
  }
}

.layout-base__content {
  @include layout-body;

  & > div {
    @apply flex flex-col h-full flex-1;
  }

  .layout-base--no-sidebar & {
    @apply pl-0;
  }

  .layout-base--no-header & {
    @apply pt-0;
  }
}
</style>
