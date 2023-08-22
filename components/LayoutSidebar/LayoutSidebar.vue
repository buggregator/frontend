<template>
  <aside class="layout-sidebar">
    <nav class="layout-sidebar__nav">
      <NuxtLink to="/" title="Events" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="events" />
      </NuxtLink>

      <NuxtLink to="/sentry" title="Sentry logs" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="sentry" />
      </NuxtLink>

      <NuxtLink to="/profiler" title="Profiler" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="profiler" />
      </NuxtLink>

      <NuxtLink to="/smtp" title="SMTP mails" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="smtp" />
      </NuxtLink>

      <NuxtLink
        to="/http-dumps"
        title="Http dumps"
        class="layout-sidebar__link"
      >
        <IconSvg class="layout-sidebar__link-icon" name="http-dumps" />
      </NuxtLink>

      <NuxtLink
        to="/inspector"
        title="Inspector logs"
        class="layout-sidebar__link"
      >
        <IconSvg class="layout-sidebar__link-icon" name="inspector" />
      </NuxtLink>

      <NuxtLink to="/settings" title="Settings" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="settings" />
      </NuxtLink>

      <div v-if="appVersion" class="layout-sidebar__nav-version">
        {{ appVersion }}
      </div>
    </nav>
  </aside>
</template>

<script lang="ts">
import IconSvg from "~/components/IconSvg/IconSvg.vue";
import { defineComponent } from "vue";
import { useNuxtApp } from "#app";
import { EVENT_TYPES } from "~/config/constants";

export default defineComponent({
  components: { IconSvg },
  props: {
    isConnected: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    if (process.client) {
      const { $config } = useNuxtApp();

      return {
        appVersion:
          !$config?.version || $config.version === "0.0.1"
            ? "@dev"
            : `v${$config.version}`,
      };
    }

    return {
      appVersion: "@dev",
    };
  },
});
</script>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-200 dark:bg-gray-800 flex flex-col justify-between z-50 w-full h-full;
}

.layout-sidebar__nav {
  @apply divide-y divide-gray-300 dark:divide-gray-600 sticky top-0 h-screen max-h-screen;
}

.layout-sidebar__link {
  @apply text-blue-500 p-3 md:p-4 lg:p-5 block hover:bg-blue-500 hover:text-white relative;

  &.router-link-active {
    @apply bg-blue-700 text-blue-200;
  }
}

.layout-sidebar__nav-version {
  @apply flex justify-center text-xs dark:text-gray-400 p-2 absolute bottom-0 left-0 right-0;
}

.layout-sidebar__link-icon {
  @apply fill-current;
}
</style>
