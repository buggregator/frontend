<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { IconSvg } from "~/src/shared/ui";
import { useConnectionStore } from "~/stores/connections";

type Props = {
  apiVersion: string;
  clientVersion: string;
  profile: object;
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
      <div class="layout-sidebar__profile">
        <div v-if="profile?.avatar" class="layout-sidebar__profile-avatar">
          <img
            :src="profile.avatar"
            class="rounded-full"
          />
        </div>
      </div>
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
  @apply w-9 sm:w-12 md:w-16;
  @apply flex flex-col justify-between;
}

.layout-sidebar__nav {
  @apply flex-col flex overflow-auto;
  @apply divide-y divide-gray-300 dark:divide-gray-600 md:divide-none;
  @apply border-b border-gray-300 dark:border-gray-600 md:border-none;
  @apply overflow-hidden;
}

.layout-sidebar__link {
  @apply block relative;
  @apply text-blue-500 hover:text-white;
  @apply hover:bg-gray-700;
  @apply flex items-center justify-center;
  @apply md:my-2 md:mx-1 lg:m-2 md:rounded-lg;

  &.router-link-active {
    @apply bg-blue-700 text-blue-200;
  }
}

.layout-sidebar__link-icon {
  @apply flex items-center justify-center;
  @apply fill-current;
  @apply mx-auto;
  @apply h-5 md:h-6;
  @apply m-2.5 md:m-3;

  & > svg {
    @apply h-auto;
  }
}

.layout-sidebar__profile {
  @apply h-9 sm:h-10 md:h-14;
  @apply p-3 mb-2;
  @apply flex items-center justify-center;
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
