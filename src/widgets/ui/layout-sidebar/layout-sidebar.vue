<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { IconSvg } from "~/src/shared/ui";
import { useConnectionStore } from "~/stores/connections";

type Props = {
  apiVersion: string;
  clientVersion: string;
};

defineProps<Props>();

const connectionStore = useConnectionStore();
const { isConnectedWS } = storeToRefs(connectionStore);

const connectionStatus = computed(() =>
  isConnectedWS.value ? "connected" : "disconnected"
);

const connectionText = computed(
  () => `WS connection is ${connectionStatus.value}`
);
</script>

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

    <div>
      <div class="layout-sidebar__connection">
        <IconSvg
          class="layout-sidebar__connection-icon"
          :name="connectionStatus"
          :title="connectionText"
        />
      </div>

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
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-200 dark:bg-gray-800;
  @apply w-9 sm:w-10 md:w-14;
  @apply flex flex-col justify-between;
}

.layout-sidebar__nav {
  @apply flex-col flex overflow-auto;
  @apply divide-y divide-gray-300 dark:divide-gray-600;
  @apply border-b border-gray-300 dark:border-gray-600;
}

.layout-sidebar__link {
  @apply text-blue-500 block hover:bg-blue-500 hover:text-white relative;
  @apply h-9 sm:h-10 md:h-14;
  @apply flex items-center justify-center;

  &.router-link-active {
    @apply bg-blue-700 text-blue-200;
  }
}

.layout-sidebar__link-icon {
  @apply fill-current;
  @apply mx-auto;
  @apply w-3 h-3 md:w-5 md:h-5 lg:w-6 lg:h-6;
}

.layout-sidebar__connection {
  @apply h-9 sm:h-10 md:h-14;
  @apply border-t border-gray-300 dark:border-gray-700;
  @apply flex items-center justify-center;
}

.layout-sidebar__connection-icon {
  @apply fill-current;
  @apply m-auto;
  @apply h-4 md:h-5 lg:h-6;
}

.layout-sidebar__versions {
  @apply whitespace-nowrap text-center leading-none;
  @apply hidden lg:block;
  @apply text-2xs dark:text-gray-600 text-gray-400;
  @apply border-t border-gray-300 dark:border-gray-700;
  @apply p-2;
}
</style>
