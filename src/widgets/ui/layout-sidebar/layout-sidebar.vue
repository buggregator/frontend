<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";
import { useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { useEvents } from "~/src/shared/lib/use-events";
import { useSettings } from "~/src/shared/lib/use-settings";
import { useSettingsStore } from "~/src/shared/stores";
import { useConnectionStore } from "~/src/shared/stores/connections";
import { useProfileStore } from "~/src/shared/stores/profile";
import { BadgeNumber, IconSvg } from "~/src/shared/ui";
import { version } from "../../../../package.json";
import { EVENTS_LINKS_MAP, EVENTS_NAV_ORDER } from "./constants";

const app = useNuxtApp();

const { isConnectedWS } = storeToRefs(useConnectionStore());
const { isVisibleEventCounts } = storeToRefs(useSettingsStore());

const profileStore = useProfileStore();
const { profile } = storeToRefs(useProfileStore());

const { getItemsCount } = useEvents();

const connectionStatus = computed(() =>
  isConnectedWS.value ? "connected" : "disconnected"
);

const avatar = computed(() => {
  if (!profile.value) return null;

  if (!profile.value?.avatar) {
    return null;
  }

  if (profile.value.avatar.startsWith("<svg")) {
    return `data:image/svg+xml;base64,${btoa(
      profile.value.avatar.replace(/&quot;/g, '"')
    )}`;
  }

  return profile.value.avatar;
});

const connectionText = computed(
  () => `WS connection is ${connectionStatus.value}`
);

const isHidden = ref(true);
const toggleProfileDropdown = () => {
  isHidden.value = !isHidden.value;
};

const logout = () => {
  profileStore.removeToken();
  const router = useRouter();
  router.push("/login");
};

const path = computed(() => useRoute().path);

const isAuthEnabled = computed(() => app?.$appSettings?.auth?.enabled);

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
});
</script>

<template>
  <aside class="layout-sidebar">
    <nav class="layout-sidebar__nav">
      <NuxtLink
        to="/"
        title="Dashboard"
        class="layout-sidebar__link layout-sidebar__link--logo"
      >
        <IconSvg class="layout-sidebar__link-icon" name="logo-short" />
      </NuxtLink>

      <NuxtLink to="/" title="Events" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="events" />
      </NuxtLink>

      <template v-for="type in EVENTS_NAV_ORDER" :key="type">
        <NuxtLink
          :to="EVENTS_LINKS_MAP[type].path"
          :title="EVENTS_LINKS_MAP[type].title"
          class="layout-sidebar__link"
          :class="{
            'router-link-active': path.includes(EVENTS_LINKS_MAP[type].path),
          }"
        >
          <BadgeNumber
            :number="getItemsCount(EVENTS_LINKS_MAP[type].eventType)"
            class="layout-sidebar__link-badge"
            :is-visible="isVisibleEventCounts"
          >
            <IconSvg
              class="layout-sidebar__link-icon"
              :name="EVENTS_LINKS_MAP[type].iconName"
            />
          </BadgeNumber>
        </NuxtLink>
      </template>

      <NuxtLink to="/settings" title="Settings" class="layout-sidebar__link">
        <IconSvg class="layout-sidebar__link-icon" name="settings" />
      </NuxtLink>
    </nav>

    <div>
      <div v-if="isAuthEnabled" class="layout-sidebar__profile">
        <div v-if="!isHidden" class="layout-sidebar__profile-dropdown">
          <div class="profile-dropdown-item profile-dropdown-item--email">
            {{ profile.email }}
          </div>
          <div
            class="profile-dropdown-item profile-dropdown-item--logout"
            @click="logout"
          >
            <IconSvg class="profile-dropdown-item--logout-icon" name="logout" />
            Logout
          </div>
        </div>
        <div
          v-if="avatar"
          class="layout-sidebar__profile-avatar"
          @click="toggleProfileDropdown"
        >
          <img :src="avatar" />
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
  @apply flex flex-col justify-between h-full;
}

.layout-sidebar__nav {
  @apply flex-col flex overflow-auto;
  @apply divide-y divide-gray-300 dark:divide-gray-600 md:divide-none;
  @apply border-b border-gray-300 dark:border-gray-600 md:border-none;
  @apply overflow-hidden;
}

.layout-sidebar__link {
  @apply block relative;
  @apply flex items-center justify-center;
  @apply md:mx-1 lg:mx-1.5 md:mt-1 lg:mt-1.5 md:rounded-lg;
  @apply px-1.5 py-2 md:px-2 md:py-3;
  @apply text-blue-500 hover:text-white hover:bg-gray-700 hover:opacity-100;

  &.router-link-active {
    @apply bg-blue-700 text-blue-200;
  }
}

.layout-sidebar__link--logo,
.layout-sidebar__link--logo.router-link-active {
  @apply text-blue-600 bg-transparent hover:text-blue-800  hover:bg-transparent;
  @apply dark:text-blue-500 dark:bg-transparent hover:dark:text-blue-200 hover:dark:bg-transparent;
}

.layout-sidebar__link-icon {
  @apply flex items-center justify-center;
  @apply fill-current;
  @apply mx-auto;
  @apply h-5 md:h-6;

  & > svg {
    @apply h-auto;
  }
}

.layout-sidebar__profile {
  @apply h-9 sm:h-10 md:h-14;
  @apply p-3 mb-2;
  @apply flex items-center justify-center;
  @apply relative;
}

.layout-sidebar__profile-dropdown {
  @apply absolute z-10 start-full bottom-0;
  @apply divide-y divide-gray-200 dark:divide-gray-600;
  @apply rounded-lg shadow-xl;
  @apply w-60;
  @apply bg-white dark:bg-gray-700;
  @apply border border-gray-300 dark:border-gray-600;
}

.profile-dropdown-item {
  @apply px-4 py-3;
  @apply text-sm;
}

.profile-dropdown-item--email {
  @apply font-semibold;
}

.profile-dropdown-item--logout {
  @apply cursor-pointer;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply flex gap-2 items-center;
  @apply font-semibold;
}

.profile-dropdown-item--logout-icon {
  @apply h-4 w-4;
}

.layout-sidebar__profile-avatar img {
  @apply w-full h-full;
  @apply rounded-full;
  @apply overflow-hidden;
  @apply hover:opacity-75;
  @apply cursor-pointer;
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
