<script lang="ts" setup>
import { useFloating } from '@floating-ui/vue'
import { onClickOutside } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PAGES_SETTINGS } from '@/shared/constants'
import { textToColors } from '@/shared/lib/helpers'
import { useEvents } from '@/shared/lib/use-events'
import { useSettingsStore, useProfileStore, useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { LocalStorageKeys, RouteName } from '@/shared/types'
import { IconSvg } from '@/shared/ui'
import { version } from '../../../../package.json' with { type: 'json' }
import { EVENTS_NAV_ORDER } from './constants'

const { isConnectedWS } = storeToRefs(useConnectionStore())
const { isVisibleEventCounts, isAuthEnabled } = storeToRefs(useSettingsStore())
const eventsStore = useEventsStore()
const { availableProjects, isMultipleProjects, activeProject } = storeToRefs(eventsStore)

const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

const { getItemsCount } = useEvents()

const projectDd = ref<HTMLElement | undefined>()
const projectMenu = ref<HTMLElement | undefined>()
const userDd = ref<HTMLElement | undefined>()
const userMenu = ref<HTMLElement | undefined>()

const isVisibleProfile = ref(false)
const isVisibleProjects = ref(false)

// Sidebar collapse state (persisted)
const isCollapsed = ref(window?.localStorage?.getItem(LocalStorageKeys.SidebarCollapsed) === 'true')

const applySidebarClass = (collapsed: boolean) => {
  if (collapsed) {
    document?.documentElement?.classList?.add('sidebar-collapsed')
  } else {
    document?.documentElement?.classList?.remove('sidebar-collapsed')
  }
}

// Apply on init
applySidebarClass(isCollapsed.value)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  window?.localStorage?.setItem(LocalStorageKeys.SidebarCollapsed, String(isCollapsed.value))
  applySidebarClass(isCollapsed.value)
}

// TODO: need to check why project is empty on first load
const isProjectLoading = computed(() => !activeProject.value)

onClickOutside(projectMenu, () => {
  isVisibleProjects.value = false
})

onClickOutside(userMenu, () => {
  isVisibleProfile.value = false
})

const { floatingStyles: projectDdStyles } = useFloating(projectDd, projectMenu, {
  placement: 'right-start'
})

const { floatingStyles: userDdStyles } = useFloating(userDd, userMenu, {
  placement: 'right'
})

const connectionStatus = computed(() => (isConnectedWS.value ? 'connected' : 'disconnected'))

const avatar = computed(() => {
  if (!profile.value) return null

  if (!profile.value?.avatar) {
    return null
  }

  if (profile.value.avatar.startsWith('<svg')) {
    return `data:image/svg+xml;base64,${btoa(profile.value.avatar.replace(/&quot;/g, '"'))}`
  }

  return profile.value.avatar
})

const profileEmail = computed(() => {
  if (!profile.value) return null

  return profile.value.email
})

const connectionText = computed(() => `WS connection is ${connectionStatus.value}`)

const toggleProfileDropdown = () => {
  isVisibleProfile.value = !isVisibleProfile.value
}

const toggleProjects = () => {
  isVisibleProjects.value = !isVisibleProjects.value
}

const logout = () => {
  profileStore.removeToken()
  const router = useRouter()
  router.push('/login')
}

const { apiVersion, availableEvents } = storeToRefs(useSettingsStore())

const clientVersion = ref(!version || version === '0.0.1' ? '@dev' : `v${version}`)

const serverVersion = computed(() =>
  String(apiVersion.value).match(/^[0-9.]+.*$/) ? `v${apiVersion.value}` : `@${apiVersion.value}`
)

const setProject = (projectKey: string) => {
  eventsStore.setActiveProjectKey(projectKey)

  isVisibleProjects.value = false
}

const filteredNavOrder = computed(() =>
  EVENTS_NAV_ORDER.filter((type) => availableEvents.value.includes(type))
)

const makeShortTitle = (title: string) => (title || '').substring(0, 2)
const generateRadialGradient = (input: string) =>
  `linear-gradient(to right, ${textToColors(input || '').join(', ')})`
</script>

<template>
  <aside
    class="layout-sidebar"
    :class="{ 'layout-sidebar--collapsed': isCollapsed }"
  >
    <nav class="layout-sidebar__nav">
      <RouterLink
        :to="{ name: RouteName.Home }"
        title="Dashboard"
        aria-label="Dashboard"
        class="layout-sidebar__link layout-sidebar__link--logo"
        tabindex="0"
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
            tabindex="0"
            aria-haspopup="true"
            :aria-expanded="isVisibleProjects"
            aria-label="Switch project"
            @click="toggleProjects"
          >
            <span
              :title="activeProject.name"
              class="layout-sidebar__project"
              :style="{
                background: generateRadialGradient(activeProject.name)
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
          aria-label="All events"
          class="layout-sidebar__link"
        >
          <IconSvg
            class="layout-sidebar__link-icon"
            name="events"
          />
          <span class="layout-sidebar__link-label">Events</span>
        </RouterLink>
      </template>

      <template
        v-for="type in filteredNavOrder"
        :key="type"
      >
        <RouterLink
          :to="{ name: RouteName.EventList, params: { type } }"
          :class="{ 'layout-sidebar__link--active': $route.params.type === type }"
          :title="PAGES_SETTINGS[type].sidebarTitle"
          :aria-label="PAGES_SETTINGS[type].sidebarTitle"
          class="layout-sidebar__link"
        >
          <IconSvg
            class="layout-sidebar__link-icon"
            :name="PAGES_SETTINGS[type].iconName"
          />
          <span class="layout-sidebar__link-label">{{ PAGES_SETTINGS[type].title }}</span>
          <span
            v-if="isVisibleEventCounts && getItemsCount(type) > 0"
            class="layout-sidebar__count"
          >
            {{ getItemsCount(type) > 99 ? '99+' : getItemsCount(type) }}
          </span>
        </RouterLink>
      </template>

      <hr class="layout-sidebar__sep">

      <RouterLink
        :to="{ name: RouteName.Settings }"
        title="Settings"
        aria-label="Settings"
        class="layout-sidebar__link"
      >
        <IconSvg
          class="layout-sidebar__link-icon"
          name="settings"
        />
        <span class="layout-sidebar__link-label">Settings</span>
      </RouterLink>
    </nav>

    <!--  Need to place projectMenu out of nav because of overflow -->
    <div
      v-if="isVisibleProjects"
      ref="projectMenu"
      role="menu"
      aria-label="Project list"
      class="layout-sidebar__dropdown-items"
      :style="projectDdStyles"
    >
      <button
        v-for="project in availableProjects"
        :key="project.key"
        class="layout-sidebar__dropdown-item"
        role="menuitem"
        :title="project.name"
        :aria-current="activeProject.key === project.key ? 'true' : undefined"
        :class="{
          'layout-sidebar__dropdown-item--active': activeProject.key === project.key
        }"
        tabindex="0"
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

    <div class="layout-sidebar__bottom">
      <div
        v-if="isAuthEnabled"
        ref="userDd"
        class="layout-sidebar__user"
      >
        <div
          v-if="isVisibleProfile"
          ref="userMenu"
          role="menu"
          aria-label="User menu"
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
          role="button"
          tabindex="0"
          aria-haspopup="true"
          :aria-expanded="isVisibleProfile"
          aria-label="User profile menu"
          @click="toggleProfileDropdown"
          @keydown.enter="toggleProfileDropdown"
          @keydown.space.prevent="toggleProfileDropdown"
        >
          <img
            :src="avatar"
            alt="profile"
          >
        </div>
      </div>

      <!-- Connection -->
      <div
        class="layout-sidebar__connection"
        :title="connectionText"
      >
        <IconSvg
          class="layout-sidebar__connection-icon"
          :name="connectionStatus"
        />
        <span class="layout-sidebar__connection-label">
          {{ isConnectedWS ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <!-- Version -->
      <div class="layout-sidebar__versions">
        <span
          v-if="serverVersion"
          class="layout-sidebar__version"
          :title="`Api: ${serverVersion}`"
        >{{ serverVersion }}</span>
        <span
          v-if="serverVersion && clientVersion"
          class="layout-sidebar__version-sep"
        >/</span>
        <span
          v-if="clientVersion"
          class="layout-sidebar__version"
          :title="`Client: ${clientVersion}`"
        >{{ clientVersion }}</span>
      </div>

      <!-- Collapse toggle -->
      <button
        class="layout-sidebar__collapse-btn"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggleCollapse"
      >
        <IconSvg
          class="layout-sidebar__collapse-icon"
          :class="{ 'layout-sidebar__collapse-icon--rotated': isCollapsed }"
          name="collapsed"
        />
        <span class="layout-sidebar__collapse-label"> Collapse </span>
      </button>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-100 dark:bg-gray-900;
  @apply flex flex-col justify-between h-full;
  @apply border-r border-gray-200 dark:border-gray-800;
}

.layout-sidebar__nav {
  @apply flex-col flex overflow-auto overflow-hidden;
  @apply py-1;
}

.layout-sidebar__sep {
  height: 1px;
  border: none;
  margin: 4px 0;
  background-color: rgba(128, 128, 128, 0.08);
}

/* ---- Links ---- */
.layout-sidebar__link {
  @apply relative cursor-pointer;
  @apply flex items-center justify-center w-full;
  @apply px-3 py-2;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply hover:bg-gray-200/50 dark:hover:bg-white/5;
  @apply transition-colors duration-100;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:justify-start xl:px-4;
  }

  .layout-sidebar__projects & {
    @apply p-2;
  }
}

.layout-sidebar__link-label {
  @apply hidden text-[13px] font-medium truncate ml-3 flex-1;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:inline;
  }
}

.layout-sidebar__count {
  @apply hidden text-[10px] font-mono tabular-nums leading-none;
  @apply min-w-[20px] text-center px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200/80 dark:bg-white/5;
  @apply text-gray-400 dark:text-gray-500;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:inline-block;
  }
}

.layout-sidebar__link--active {
  @apply text-gray-900 dark:text-gray-50;
  @apply bg-gray-200/80 dark:bg-white/[0.08];

  .layout-sidebar__count {
    @apply bg-gray-300/80 dark:bg-white/10;
    @apply text-gray-600 dark:text-gray-300;
  }
}

.layout-sidebar__link--logo {
  @apply text-gray-900 dark:text-white bg-transparent;
  @apply hover:bg-transparent;
  @apply py-3;

  .layout-sidebar__link-icon {
    @apply w-7 h-7;
  }
}

.layout-sidebar__link-icon {
  @apply flex items-center justify-center flex-shrink-0;
  @apply fill-current;
  @apply w-5 h-5;

  & > svg {
    @apply h-auto;
  }
}

/* ---- Projects ---- */
.layout-sidebar__projects {
  @apply flex items-center justify-center flex-col;
}

.layout-sidebar__project {
  @apply text-2xs font-semibold uppercase;
  @apply h-7 w-7 rounded;
  @apply flex items-center justify-center relative flex-shrink-0;
  @apply text-white dark:text-black;
}

/* ---- Dropdown ---- */
.layout-sidebar__dropdown {
  @apply h-10;
  @apply p-2;
  @apply flex items-center justify-center;
  @apply relative cursor-pointer;
}

.layout-sidebar__dropdown-items {
  @apply divide-y divide-gray-100 dark:divide-gray-700;
  @apply rounded-lg shadow-xl;
  @apply min-w-60;
  @apply border border-gray-200 dark:border-gray-700;
  @apply bg-white dark:bg-gray-800;
}

.layout-sidebar__dropdown-item {
  @apply px-4 py-2.5;
  @apply text-sm;
  @apply cursor-pointer;
  @apply bg-white dark:bg-gray-800;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700;
  @apply flex gap-3 items-center text-left w-full;
  @apply transition-colors;

  &:first-child {
    @apply rounded-t-lg;
  }

  &:last-child {
    @apply rounded-b-lg;
  }
}

.layout-sidebar__dropdown-item--active {
  @apply font-medium;
  @apply bg-gray-50 dark:bg-gray-700;
}

.layout-sidebar__dropdown-item-icon {
  @apply h-4 w-4;
}

.layout-sidebar__dropdown-item-text {
  @apply flex flex-col;
}

.layout-sidebar__dropdown-item-text-key {
  @apply text-2xs uppercase font-normal -mt-0.5;
  @apply text-gray-500 dark:text-gray-400;
}

.layout-sidebar__dropdown-avatar img {
  @apply w-full h-full;
  @apply rounded-full;
  @apply overflow-hidden;
  @apply hover:opacity-75;
  @apply cursor-pointer;
}

/* ---- Bottom section ---- */
.layout-sidebar__bottom {
  @apply px-3 py-2;
  border-top: 1px solid rgba(128, 128, 128, 0.08);
}

.layout-sidebar__user {
  @apply flex items-center justify-center;
  @apply p-1 mb-2;
  @apply relative cursor-pointer;
}

/* Connection */
.layout-sidebar__connection {
  @apply flex items-center justify-center gap-2;
  @apply py-2 px-1;
}

.layout-sidebar__connection-icon {
  @apply fill-current flex-shrink-0;
  @apply h-4 w-4;
}

.layout-sidebar__connection-label {
  @apply hidden text-xs text-gray-500 dark:text-gray-500;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:inline;
  }
}

/* Versions */
.layout-sidebar__versions {
  @apply whitespace-nowrap text-center leading-none;
  @apply hidden lg:flex items-center justify-center;
  @apply text-2xs text-gray-400 dark:text-gray-600;
  @apply gap-1.5 py-1.5 px-1;
  border-top: 1px solid rgba(128, 128, 128, 0.08);
}

.layout-sidebar__version {
  @apply font-mono;
}

.layout-sidebar__version-sep {
  @apply text-gray-300 dark:text-gray-700;
}

/* ---- Collapse toggle (Figma/JetBrains style) ---- */
.layout-sidebar__collapse-btn {
  @apply hidden xl:flex items-center justify-center;
  @apply w-full py-2;
  @apply text-gray-400 dark:text-gray-600;
  @apply hover:text-gray-600 dark:hover:text-gray-400;
  @apply hover:bg-gray-200/50 dark:hover:bg-white/5;
  @apply transition-colors duration-100 cursor-pointer;
  border-top: 1px solid rgba(128, 128, 128, 0.08);

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:justify-start xl:px-4;
  }
}

.layout-sidebar__collapse-label {
  @apply hidden text-xs ml-3 text-gray-400 dark:text-gray-600;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply xl:inline;
  }
}

.layout-sidebar__collapse-icon {
  @apply w-4 h-4 flex-shrink-0;
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
}

.layout-sidebar__collapse-icon--rotated {
  transform: rotate(90deg);
}
</style>
