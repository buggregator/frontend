<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { LayoutSidebar } from "~/src/widgets/ui";
import { useEvents } from "~/src/shared/lib/use-events";
import SfdumpWrap from "~/src/shared/lib/vendor/dumper";
import { useEventsStore } from "~/src/shared/stores";

SfdumpWrap(window.document);

const { activeProjectKey } = storeToRefs(useEventsStore());
const { events } = useEvents();

watch(
  () => activeProjectKey.value,
  () => {
    events.getAll();
  },
  { immediate: true },
);
</script>

<template>
  <div class="main-layout">
    <div class="main-layout__sidebar">
      <slot name="sidebar">
        <LayoutSidebar />
      </slot>
    </div>

    <div class="main-layout__header">
      <slot name="header" />
    </div>

    <div class="main-layout__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.main-layout {
  @apply flex min-h-screen items-stretch relative;
}

.main-layout__sidebar {
  @apply w-10 md:w-14 lg:w-16 flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
  @include layout-sidebar;
}

.main-layout__header {
  @include layout-head;
}

.main-layout__content {
  @include layout-body;
  @apply flex flex-col h-full flex-1 w-full min-h-screen absolute top-0 left-0;

  & > div {
    @apply flex flex-col h-full flex-1;
  }
}
</style>
