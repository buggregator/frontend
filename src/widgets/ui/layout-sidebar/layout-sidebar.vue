<script lang="ts" setup>
import { useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { PAGES_SETTINGS } from "@/shared/constants";
import { textToColors } from "@/shared/lib/helpers";
import { useEvents } from "@/shared/lib/use-events";
import { useSettingsStore, useProfileStore, useEventsStore } from "@/shared/stores";
import { useConnectionStore } from "@/shared/stores/connections";
import { RouteName } from "@/shared/types";
import { BadgeNumber, IconSvg } from "@/shared/ui";
import { version } from "../../../../package.json" with { type: "json" };
import { EVENTS_NAV_ORDER } from "./constants";

const { isConnectedWS } = storeToRefs(useConnectionStore());
const { isVisibleEventCounts, isAuthEnabled } = storeToRefs(useSettingsStore());
const eventsStore = useEventsStore();
const { availableProjects, isMultipleProjects, activeProject } = storeToRefs(eventsStore);

const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);

const { getItemsCount } = useEvents();

const projectDd = ref<HTMLElement | undefined>();
const projectMenu = ref<HTMLElement | undefined>();
const userDd = ref<HTMLElement | undefined>();
const userMenu = ref<HTMLElement | undefined>();

const isVisibleProfile = ref(false);
const isVisibleProjects = ref(false);

// TODO: need to check why project is empty on first load
const isProjectLoading = computed(() =>
  !activeProject.value);

onClickOutside(projectMenu, () => {
  isVisibleProjects.value = false;
});

onClickOutside(userMenu, () => {
  isVisibleProfile.value = false;
});

const { floatingStyles: projectDdStyles } = useFloating(projectDd, projectMenu, {
  placement: "right-start",
});

const { floatingStyles: userDdStyles } = useFloating(userDd, userMenu, {
  placement: "right",
});

const connectionStatus = computed(() =>
  (isConnectedWS.value ? "connected" : "disconnected"));

const avatar = computed(() => {
  if (!profile.value) return null;

  if (!profile.value?.avatar) {
    return null;
  }

  if (profile.value.avatar.startsWith("<svg")) {
    return `data:image/svg+xml;base64,${btoa(profile.value.avatar.replace(/&quot;/g, '"'))}`;
  }

  return profile.value.avatar;
});

const profileEmail = computed(() => {
  if (!profile.value) return null;

  return profile.value.email;
});

const connectionText = computed(() =>
  `WS connection is ${connectionStatus.value}`);

const toggleProfileDropdown = () => {
  isVisibleProfile.value = !isVisibleProfile.value;
};

const toggleProjects = () => {
  isVisibleProjects.value = !isVisibleProjects.value;
};

const logout = () => {
  profileStore.removeToken();
  const router = useRouter();
  router.push("/login");
};

const { apiVersion, availableEvents } = storeToRefs(useSettingsStore());

const clientVersion = ref(!version || version === "0.0.1" ? "@dev" : `v${version}`);

const serverVersion = computed(() =>
  String(apiVersion.value).match(/^[0-9.]+.*$/) ? `v${apiVersion.value}` : `@${apiVersion.value}`);

const setProject = (projectKey: string) => {
  eventsStore.setActiveProjectKey(projectKey);

  isVisibleProjects.value = false;
};

const filteredNavOrder = computed(() =>
  EVENTS_NAV_ORDER.filter((type) =>
    availableEvents.value.includes(type)));

const makeShortTitle = (title: string) =>
  (title || "").substring(0, 2);
const generateRadialGradient = (input: string) =>
  `linear-gradient(to right, ${textToColors(input || "").join(", ")})`;
</script>

<template>
  <aside class="layout-sidebar">
    <nav class="layout-sidebar__nav">
      <RouterLink
        :to="{ name: RouteName.Home }"
        title="Dashboard"
        class="layout-sidebar__link layout-sidebar__link--logo"
        tabindex="1"
      >
        <IconSvg
          class="layout-sidebar__link-icon"
          name="logo-short"
        />
      </RouterLink>

      <template v-if="!isProjectLoading && isMultipleProjects">
        <hr class="layout-sidebar__sep">

        <div class="layout-sidebar__projects">
          <button
            ref="projectDd"
            class="layout-sidebar__dropdown"
            tabindex="1"
            @click="toggleProjects"
          >
            <span
              :title="activeProject.name"
              class="layout-sidebar__project"
              :style="{
                background: generateRadialGradient(activeProject.name),
              }"
            >
              {{ makeShortTitle(activeProject.name) }}
            </span>
          </button>
        </div>

        <hr class="layout-sidebar__sep">
      </template>

      <template v-if="!isMultipleProjects || isProjectLoading">
        <RouterLink
          :to="{ name: RouteName.Home }"
          title="Events"
          class="layout-sidebar__link"
        >
          <IconSvg
            class="layout-sidebar__link-icon"
            name="events"
          />
        </RouterLink>
      </template>

      <RouterLink
        v-for="type in filteredNavOrder"
        :key="type"
        class="layout-sidebar__link"
        :to="{ name: RouteName.EventList, params: { type } }"
        :class="{ 'layout-sidebar__link--active': $route.params.type === type }"
        :title="PAGES_SETTINGS[type].sidebarTitle"
      >
        <BadgeNumber
          :number="getItemsCount(type)"
          class="layout-sidebar__link-badge"
          :is-visible="isVisibleEventCounts"
        >
          <IconSvg
            class="layout-sidebar__link-icon"
            :name="PAGES_SETTINGS[type].iconName"
          />
        </BadgeNumber>
      </RouterLink>

      <RouterLink
        :to="{ name: RouteName.Settings }"
        title="Settings"
        class="layout-sidebar__link"
      >
        <IconSvg
          class="layout-sidebar__link-icon"
          name="settings"
        />
      </RouterLink>
    </nav>

    <!--  Need to place projectMenu out of nav because of overflow -->
    <div
      v-if="isVisibleProjects"
      ref="projectMenu"
      class="layout-sidebar__dropdown-items"
      :style="projectDdStyles"
    >
      <button
        v-for="project in availableProjects"
        :key="project.key"
        class="layout-sidebar__dropdown-item"
        :title="project.name"
        :class="{
          'layout-sidebar__dropdown-item--active': activeProject.key === project.key,
        }"
        tabindex="1"
        @click="setProject(project.key)"
      >
        <span
          class="layout-sidebar__project"
          :style="{ background: generateRadialGradient(project.name) }"
        >
          {{ makeShortTitle(project.name) }}
        </span>

        <div class="layout-sidebar__dropdown-item-text">
          <span class="layout-sidebar__dropdown-item-text-key">
            {{ project.key }}
          </span>
          {{ project.name }}
        </div>
      </button>
    </div>

    <div>
      <div
        v-if="isAuthEnabled"
        ref="userDd"
        class="layout-sidebar__dropdown"
      >
        <div
          v-if="isVisibleProfile"
          ref="userMenu"
          class="layout-sidebar__dropdown-items"
          :style="userDdStyles"
        >
          <button
            v-if="profileEmail"
            class="layout-sidebar__dropdown-item layout-sidebar__dropdown-item--active"
          >
            {{ profileEmail }}
          </button>
          <button
            class="layout-sidebar__dropdown-item layout-sidebar__dropdown-item--active"
            @click="logout"
          >
            <IconSvg
              class="layout-sidebar__dropdown-item-icon"
              name="logout"
            />
            Logout
          </button>
        </div>

        <div
          v-if="avatar"
          class="layout-sidebar__dropdown-avatar"
          @click="toggleProfileDropdown"
        >
          <img
            :src="avatar"
            alt="profile"
          >
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
          v-if="serverVersion"
          class="layout-sidebar__nav-version"
          :title="`Api version: ${serverVersion}`"
        >
          {{ serverVersion }}
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
  @apply flex-col flex overflow-auto md:gap-1 lg:gap-1.5;
  @apply md:p-1 lg:p-1.5;
  @apply divide-y divide-gray-300 dark:divide-gray-600 md:divide-none;
  @apply border-b border-gray-300 dark:border-gray-600 md:border-none;
  @apply overflow-hidden;
}

.layout-sidebar__sep {
  @apply bg-gray-300 dark:bg-gray-500 h-0.5;
}

.layout-sidebar__link {
  @apply relative cursor-pointer flex;
  @apply flex items-center justify-center w-full;
  @apply md:rounded-lg;
  @apply px-1.5 py-2 md:px-2 md:py-3;
  @apply text-blue-500 hover:text-white hover:bg-gray-700 hover:opacity-100;

  .layout-sidebar__projects & {
    @apply p-1.5 md:p-2;
  }
}

.layout-sidebar__link--active {
  @apply bg-blue-700 text-blue-200;
}

.layout-sidebar__link--logo {
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

.layout-sidebar__projects {
  @apply flex items-center justify-center flex-col;
}

.layout-sidebar__project {
  @apply text-2xs font-semibold uppercase;
  @apply h-6 md:h-8 w-7 md:w-8 rounded-lg;
  @apply flex items-center justify-center relative flex-shrink-0;
  @apply text-white dark:text-black self-start;
}

.layout-sidebar__dropdown-item-text {
  @apply flex flex-col;
}

.layout-sidebar__dropdown-item-text-key {
  @apply text-2xs uppercase font-normal -mt-0.5;
  @apply text-gray-600 dark:text-gray-400;
}

.layout-sidebar__dropdown {
  @apply h-9 sm:h-10 md:h-14;
  @apply p-3;
  @apply flex items-center justify-center;
  @apply relative cursor-pointer;
}

.layout-sidebar__dropdown-items {
  @apply divide-y divide-gray-200 dark:divide-gray-600;
  @apply rounded-lg shadow-xl;
  @apply min-w-60;
  @apply border border-gray-300 dark:border-gray-600;
}

.layout-sidebar__dropdown-item {
  @apply px-4 py-3;
  @apply text-sm;
  @apply cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply hover:bg-gray-200 dark:hover:bg-gray-600;
  @apply flex gap-4 items-center text-left w-full;

  &:first-child {
    @apply rounded-t-lg;
  }

  &:last-child {
    @apply rounded-b-lg;
  }
}

.layout-sidebar__dropdown-item--active {
  @apply font-semibold;
  @apply bg-gray-100 dark:bg-gray-700;
}

.layout-sidebar__dropdown-item-icon {
  @apply h-4 w-4;
}

.layout-sidebar__dropdown-avatar img {
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
