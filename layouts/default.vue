<script lang="ts" setup>
import { onMounted } from "vue";
import { LayoutSidebar } from "~/src/widgets/ui";
import { useEvents } from "~/src/shared/lib/use-events";
import SfdumpWrap from "~/src/shared/lib/vendor/dumper";
import { useSettingsStore } from "~~/src/shared/stores";

useSettingsStore();
SfdumpWrap(window.document);

onMounted(() => {
  const { events } = useEvents();

  if (!events?.items?.value?.length) {
    events.getAll();
  }
});
</script>

<template>
  <div class="main-layout">
    <LayoutSidebar class="main-layout__sidebar" />

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

.main-layout__content {
  @apply flex flex-col h-full flex-1 w-full min-h-screen absolute top-0 left-0 pl-10 md:pl-14 lg:pl-16;

  & > div {
    @apply flex flex-col h-full flex-1;
  }
}
</style>
