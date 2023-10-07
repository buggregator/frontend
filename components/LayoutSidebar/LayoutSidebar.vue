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
    </nav>

    <div class="layout-sidebar__versions">
      <div
        v-if="apiVersion"
        class="layout-sidebar__nav-version"
        :title="`Api version: ${apiVersion}`"
      >
        {{ apiVersion }}
      </div>

      <div
        v-if="clientVersion"
        class="layout-sidebar__nav-version"
        :title="`Client version: ${clientVersion}`"
      >
        {{ clientVersion }}
      </div>
    </div>
  </aside>
</template>

<script lang="ts">
import IconSvg from "~/components/IconSvg/IconSvg.vue";
import { defineComponent } from "vue";
import { useNuxtApp } from "#app";

export default defineComponent({
  components: { IconSvg },
  props: {
    isConnected: {
      type: Boolean,
      required: true,
    },
    apiVersion: {
      type: String,
      default: "@dev",
    },
    clientVersion: {
      type: String,
      default: "@dev",
    },
  },
});
</script>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-200 dark:bg-gray-800 flex flex-col justify-between z-50 w-full h-full sticky top-0 h-screen max-h-screen;
}

.layout-sidebar__nav {
  @apply divide-gray-300 dark:divide-gray-600 flex-col flex overflow-auto divide-y divide-gray-300 dark:divide-gray-600 border-b border-gray-300 dark:border-gray-600;
}

.layout-sidebar__link {
  @apply text-blue-500 p-3 md:p-4 lg:p-5 block hover:bg-blue-500 hover:text-white relative;

  &.router-link-active {
    @apply bg-blue-700 text-blue-200;
  }
}

.layout-sidebar__link-icon {
  @apply fill-current;
}

.layout-sidebar__versions {
  @apply flex justify-center text-xs dark:text-gray-600 text-gray-400 py-2 px-1 left-0 right-0 flex-col mt-auto whitespace-nowrap text-center border-t border-gray-300 dark:border-gray-600;

  font-size: 0.8em;
}
</style>
