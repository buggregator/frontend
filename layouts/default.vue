<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { LayoutSidebar } from "~/src/widgets/ui";
import { useEvents } from "~/src/shared/lib/use-events";
import { useSettings } from "~/src/shared/lib/use-settings";
import SfdumpWrap from "~/src/shared/lib/vendor/dumper";
import { version } from "../package.json";
import { useSettingsStore } from "~/stores/settings";

SfdumpWrap(window.document);
useSettingsStore();

const {
  api: { getVersion },
} = useSettings();

const apiVersion = ref("");
const clientVersion = ref(
  !version || version === "0.0.1" ? "@dev" : `v${version}`
);

const getApiVersion = async () => {
  const data = await getVersion();

  apiVersion.value = String(data).match(/^[0-9.]+.*$/)
    ? `v${data}`
    : `@${data}`;
};

onMounted(() => {
  getApiVersion();

  const { events } = useEvents();

  if (!events?.items?.value?.length) {
    events.getAll();
  }
});
</script>

<template>
  <div class="main-layout">
    <LayoutSidebar
      class="main-layout__sidebar"
      :api-version="apiVersion"
      :client-version="clientVersion"
    />

    <div class="main-layout__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.main-layout {
  @apply flex min-h-screen items-stretch relative;
}

.main-layout__sidebar {
  @apply w-10 md:w-14 lg:w-16 flex-none border-r border-gray-200 dark:border-gray-700 z-50 w-full h-full sticky top-0 h-screen max-h-screen;
}

.main-layout__header {
  @apply flex-none w-full h-10;
}

.main-layout__content {
  @apply flex flex-col h-full flex-1 w-full min-h-screen absolute top-0 left-0 pl-10 md:pl-14 lg:pl-16;

  & > div {
    @apply flex flex-col h-full flex-1;
  }
}

.main-layout__sidebar {
  @include layout-sidebar;
}
</style>
