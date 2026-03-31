<script lang="ts" setup>
import { useFloating } from '@floating-ui/vue'
import { onClickOutside, useMediaQuery } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PAGES_SETTINGS } from '@/shared/constants'
import { textToColors } from '@/shared/lib/helpers'
import { useEvents } from '@/shared/lib/use-events'
import { useSettingsStore, useProfileStore, useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { type EventType, LocalStorageKeys, RouteName } from '@/shared/types'
import { IconSvg } from '@/shared/ui'
import { EVENTS_NAV_ORDER } from './constants'

const { isConnectedWS } = storeToRefs(useConnectionStore())
const { isVisibleEventCounts, isAuthEnabled } = storeToRefs(useSettingsStore())
const eventsStore = useEventsStore()
const { availableProjects, isMultipleProjects, activeProject, lockedIds } = storeToRefs(eventsStore)

const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

const { getItemsCount } = useEvents()

const projectDd = ref<HTMLElement | undefined>()
const projectMenu = ref<HTMLElement | undefined>()
const userDd = ref<HTMLElement | undefined>()
const userMenu = ref<HTMLElement | undefined>()

const isVisibleProfile = ref(false)
const isVisibleProjects = ref(false)

// Sidebar collapse state (persisted, collapsed by default)
const storedCollapsed = window?.localStorage?.getItem(LocalStorageKeys.SidebarCollapsed)
const isCollapsed = ref(storedCollapsed === null ? true : storedCollapsed === 'true')

// Below xl breakpoint = always visually collapsed (same rules as manual collapse)
const isBelowXl = useMediaQuery('(max-width: 1279px)')
const isVisuallyCollapsed = computed(() => isCollapsed.value || isBelowXl.value)

const applySidebarClass = (collapsed: boolean) => {
  if (collapsed) {
    document?.documentElement?.classList?.add('sidebar-collapsed')
  } else {
    document?.documentElement?.classList?.remove('sidebar-collapsed')
  }
}

// Apply on init
applySidebarClass(isCollapsed.value)

// Clean up global class when component is destroyed (e.g. Storybook story switch)
onUnmounted(() => {
  document?.documentElement?.classList?.remove('sidebar-collapsed')
})

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

const { availableEvents } = storeToRefs(useSettingsStore())

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

const hasEvents = (type: EventType) => isVisibleEventCounts.value && getItemsCount.value(type) > 0
</script>

<template>
  <aside
    class="layout-sidebar"
    :class="{ 'layout-sidebar--collapsed': isVisuallyCollapsed }"
  >
    <!-- Edge expand handle (visible only when collapsed) -->
    <button
      v-if="isVisuallyCollapsed"
      class="layout-sidebar__edge-handle"
      aria-label="Expand sidebar"
      title="Expand sidebar"
      @click="toggleCollapse"
    >
      <svg
        class="layout-sidebar__edge-chevron"
        viewBox="0 0 6 16"
        fill="none"
      >
        <path
          d="M1 1L5 8L1 15"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <nav class="layout-sidebar__nav">
      <!-- Logo + collapse toggle header -->
      <div class="layout-sidebar__header">
        <RouterLink
          :to="{ name: RouteName.Home }"
          title="Dashboard"
          aria-label="Dashboard"
          class="layout-sidebar__logo-link"
          tabindex="0"
        >
          <IconSvg
            v-if="isVisuallyCollapsed"
            class="layout-sidebar__logo-icon"
            name="logo-short"
          />
          <IconSvg
            v-else
            class="layout-sidebar__logo-full"
            name="logo"
          />
        </RouterLink>

        <button
          v-if="!isVisuallyCollapsed"
          class="layout-sidebar__toggle-btn"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
          @click="toggleCollapse"
        >
          <IconSvg
            class="layout-sidebar__toggle-icon"
            name="sidebar-left"
          />
        </button>
      </div>

      <hr class="layout-sidebar__sep">

      <template v-if="!isProjectLoading && isMultipleProjects">
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
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              name="events"
            />
          </span>
          <span class="layout-sidebar__link-label">Events</span>
        </RouterLink>
      </template>

      <template
        v-for="type in filteredNavOrder"
        :key="type"
      >
        <RouterLink
          :to="
            type === 'sentry'
              ? '/sentry/exceptions'
              : { name: RouteName.EventList, params: { type } }
          "
          :class="{
            'layout-sidebar__link--active':
              $route.params.type === type ||
              (type === 'sentry' && $route.path.startsWith('/sentry'))
          }"
          :title="PAGES_SETTINGS[type].sidebarTitle"
          :aria-label="PAGES_SETTINGS[type].sidebarTitle"
          class="layout-sidebar__link"
        >
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              :name="PAGES_SETTINGS[type].iconName"
            />
            <span
              v-if="hasEvents(type)"
              class="layout-sidebar__dot"
              :class="`layout-sidebar__dot--${type}`"
            />
          </span>
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
        :to="{ name: RouteName.Favorites }"
        title="Favorites"
        aria-label="Favorites"
        class="layout-sidebar__link"
      >
        <span class="layout-sidebar__link-icon-wrap">
          <IconSvg
            class="layout-sidebar__link-icon"
            name="pin"
          />
          <span
            v-if="lockedIds.length > 0"
            class="layout-sidebar__dot layout-sidebar__dot--favorites"
          />
        </span>
        <span class="layout-sidebar__link-label">Favorites</span>
        <span
          v-if="isVisibleEventCounts && lockedIds.length > 0"
          class="layout-sidebar__count"
        >
          {{ lockedIds.length > 99 ? '99+' : lockedIds.length }}
        </span>
      </RouterLink>

      <RouterLink
        :to="{ name: RouteName.Settings }"
        title="Settings"
        aria-label="Settings"
        class="layout-sidebar__link"
      >
        <span class="layout-sidebar__link-icon-wrap">
          <IconSvg
            class="layout-sidebar__link-icon"
            name="settings"
          />
        </span>
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

      <!-- Connection indicator -->
      <div
        class="layout-sidebar__connection"
        :title="connectionText"
      >
        <span
          class="layout-sidebar__connection-dot"
          :class="
            isConnectedWS
              ? 'layout-sidebar__connection-dot--on'
              : 'layout-sidebar__connection-dot--off'
          "
        />
        <span class="layout-sidebar__connection-label">
          {{ isConnectedWS ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-100 dark:bg-gray-900;
  @apply flex flex-col justify-between h-full;
  @apply border-r border-gray-200 dark:border-gray-800;
  @apply relative;
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

/* ---- Header (logo + toggle) ---- */
.layout-sidebar__header {
  @apply flex items-center justify-center relative;
  @apply px-3 py-3;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply justify-start px-4;
  }
}

.layout-sidebar__logo-link {
  @apply flex items-center;
  @apply text-gray-900 dark:text-white;
}

.layout-sidebar__logo-icon {
  @apply w-6 h-6 flex-shrink-0;
  @apply fill-current;
}

.layout-sidebar__logo-full {
  @apply h-6 flex-shrink-0;
  @apply fill-current;

  :deep(svg) {
    @apply h-full w-auto;
  }
}

.layout-sidebar__toggle-btn {
  @apply hidden;
  @apply items-center justify-center;
  @apply w-6 h-6 rounded-md;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply hover:bg-gray-200/60 dark:hover:bg-white/5;
  @apply transition-colors duration-100 cursor-pointer;
  @apply flex-shrink-0;
  @apply absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply flex;
  }
}

.layout-sidebar__toggle-icon {
  @apply w-3.5 h-3.5;
}

/* ---- Edge expand handle (collapsed mode) ---- */
.layout-sidebar__edge-handle {
  @apply absolute z-10;
  @apply flex items-center justify-center;
  @apply cursor-pointer;
  @apply rounded-r-md;
  @apply bg-gray-200/80 dark:bg-gray-700/80;
  @apply hover:bg-gray-300 dark:hover:bg-gray-600;
  @apply text-gray-400 dark:text-gray-500;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply opacity-0 transition-all duration-200;
  width: 12px;
  height: 32px;
  top: 50%;
  right: 0;
  transform: translate(100%, -50%);

  .layout-sidebar:hover & {
    @apply opacity-100;
  }
}

.layout-sidebar__edge-chevron {
  width: 6px;
  height: 14px;
  flex-shrink: 0;
}

/* ---- Links ---- */
.layout-sidebar__link {
  @apply relative cursor-pointer;
  @apply flex items-center justify-center w-full;
  @apply px-3 py-2;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-800 dark:hover:text-gray-200;
  @apply transition-colors duration-100;

  /* Expanded mode: full-width highlight */
  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply justify-start px-4;
    @apply hover:bg-gray-200/50 dark:hover:bg-white/5;
  }

  /* Collapsed mode: no full-width highlight, icon-wrap gets it */
  .layout-sidebar--collapsed & {
    @apply hover:bg-transparent dark:hover:bg-transparent;
  }

  .layout-sidebar__projects & {
    @apply p-2;
  }
}

.layout-sidebar__link-icon-wrap {
  @apply relative flex-shrink-0;
  @apply flex items-center justify-center;
  @apply w-8 h-8;
  @apply rounded-lg;
  @apply transition-all duration-100;

  .layout-sidebar--collapsed .layout-sidebar__link:hover & {
    @apply bg-gray-200/70 dark:bg-white/[0.08];
  }

  .layout-sidebar--collapsed .layout-sidebar__link--active & {
    @apply bg-gray-200/80 dark:bg-white/[0.08];
  }
}

.layout-sidebar__link-icon {
  @apply flex items-center justify-center flex-shrink-0;
  @apply fill-current;
  @apply w-5 h-5;
  @apply transition-all duration-100;

  & > svg {
    @apply h-auto;
  }
}

.layout-sidebar__link-label {
  @apply hidden text-sm font-medium truncate ml-3 flex-1;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline;
  }
}

.layout-sidebar__count {
  @apply hidden text-[10px] font-mono tabular-nums leading-none;
  @apply min-w-[20px] text-center px-1.5 py-0.5 rounded-full;
  @apply bg-gray-200/80 dark:bg-white/5;
  @apply text-gray-400 dark:text-gray-500;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline-block;
  }
}

/* Colored dot indicator for collapsed mode */
.layout-sidebar__dot {
  @apply absolute;
  @apply w-[6px] h-[6px] rounded-full;
  @apply bg-gray-400;
  top: -1px;
  right: -2px;
  box-shadow: 0 0 0 1.5px theme('colors.gray.100');

  .dark & {
    box-shadow: 0 0 0 1.5px theme('colors.gray.900');
  }

  /* Hide dot in expanded mode (count badge is shown instead) */
  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply hidden;
  }
}

$dotColors: (
  'sentry': 'rose',
  'profiler': 'violet',
  'smtp': 'amber',
  'http-dump': 'green',
  'inspector': 'yellow',
  'var-dump': 'orange',
  'monolog': 'teal',
  'ray': 'cyan'
);

@each $type, $color in $dotColors {
  .layout-sidebar__dot--#{$type} {
    @apply bg-#{$color}-500 dark:bg-#{$color}-400;
  }
}

.layout-sidebar__dot--favorites {
  @apply bg-amber-500 dark:bg-amber-400;
}

.layout-sidebar__link--active {
  @apply text-gray-900 dark:text-gray-50;

  /* Expanded: full-width bg */
  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply bg-gray-200/80 dark:bg-white/[0.08];
  }

  /* Collapsed: no full-width bg (icon-wrap handles it) */
  .layout-sidebar--collapsed & {
    @apply bg-transparent dark:bg-transparent;
  }

  .layout-sidebar__count {
    @apply bg-gray-300/80 dark:bg-white/10;
    @apply text-gray-600 dark:text-gray-300;
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

/* Connection indicator */
.layout-sidebar__connection {
  @apply flex items-center justify-center gap-2;
  @apply py-2 px-1;
}

.layout-sidebar__connection-dot {
  @apply w-2 h-2 rounded-full flex-shrink-0;
  @apply transition-colors duration-300;
}

.layout-sidebar__connection-dot--on {
  @apply bg-emerald-500;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.layout-sidebar__connection-dot--off {
  @apply bg-red-400 dark:bg-red-500;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.3);
}

.layout-sidebar__connection-label {
  @apply hidden text-xs text-gray-500 dark:text-gray-500;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline;
  }
}
</style>
