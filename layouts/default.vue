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

<script lang="ts">
import { storeToRefs } from "pinia";
import { defineComponent } from "vue";
import { LayoutSidebar } from "~/src/widgets/ui";
import { useEvents } from "~/src/shared/lib/use-events";
import { useSettings } from "~/src/shared/lib/use-settings";
import SfdumpWrap from "~/src/shared/lib/vendor/dumper";
import { version } from "../package.json";
import { useSettingsStore } from "~/stores/settings";

export default defineComponent({
  components: {
    LayoutSidebar,
  },

  async setup() {
    SfdumpWrap(window.document);

    const settingsStore = useSettingsStore();
    const { themeType, isFixedHeader } = storeToRefs(settingsStore);

    const {
      api: { getVersion },
    } = useSettings();

    const apiVersion = await getVersion();

    const { events } = useEvents();

    if (!events?.items?.value?.length) {
      events.getAll();
    }

    const clientVersion =
      !version || version === "0.0.1" ? "@dev" : `v${version}`;

    return {
      themeType,
      isFixedHeader,
      apiVersion: String(apiVersion).match(/^[0-9.]+.*$/)
        ? `v${apiVersion}`
        : `@${apiVersion}`,
      clientVersion,
    };
  },
});
</script>

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
