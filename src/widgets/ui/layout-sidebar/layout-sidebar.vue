<script lang="ts" setup>
import { flip, shift, useFloating } from '@floating-ui/vue'
import { onClickOutside, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update/lib'
import { useXdebugEnabled } from '@/entities/xdebug/lib'
import { MENU_EVENT_GROUPS, MENU_TOOL_IDS, PAGES_SETTINGS, typePageLink } from '@/shared/constants'
import { isCommandPaletteOpen, paletteKeyCaption } from '@/shared/lib/command-palette'
import { useEvents } from '@/shared/lib/use-events'
import { useMenuKeys } from '@/shared/lib/use-menu-keys'
import { useSeenEvents } from '@/shared/lib/use-seen-events'
import { useSettingsStore, useProfileStore, useEventsStore } from '@/shared/stores'
import { useConnectionStore } from '@/shared/stores/connections'
import { type EventType, EventTypes, LocalStorageKeys, RouteName } from '@/shared/types'
import { IconSvg, ProjectAvatar, UserAvatar } from '@/shared/ui'
import { navLinkLabel } from './nav-label'

const { isConnectedWS } = storeToRefs(useConnectionStore())
const { isVisibleEventCounts, isAuthEnabled } = storeToRefs(useSettingsStore())
const eventsStore = useEventsStore()
const { availableProjects, isMultipleProjects, activeProject, lockedIds } = storeToRefs(eventsStore)

const profileStore = useProfileStore()
const { profile, isAdmin } = storeToRefs(profileStore)

const { getItemsCount } = useEvents()
const xdebugEnabled = useXdebugEnabled()

const route = useRoute()
const router = useRouter()

const projectDd = ref<HTMLElement | undefined>()
const projectMenu = ref<HTMLElement | undefined>()
const userDd = ref<HTMLElement | undefined>()
const userMenu = ref<HTMLElement | undefined>()

const isVisibleProfile = ref(false)
const isVisibleProjects = ref(false)

// Sidebar collapse state (persisted, collapsed by default)
const storedCollapsed = window?.localStorage?.getItem(LocalStorageKeys.SidebarCollapsed)
const isCollapsed = ref(storedCollapsed === null ? true : storedCollapsed === 'true')

// Below xl the page keeps the narrow rail; expanding opens the full menu over
// the page instead (not remembered, closes on Esc, outside click or navigation).
const isBelowXl = useMediaQuery('(max-width: 1279px)')
const isOverlayOpen = ref(false)
const isOverlay = computed(() => isBelowXl.value && isOverlayOpen.value)
const isVisuallyCollapsed = computed(() =>
  isBelowXl.value ? !isOverlayOpen.value : isCollapsed.value
)
const expandBtn = ref<HTMLElement | undefined>()
const closeBtn = ref<HTMLElement | undefined>()

const applySidebarClass = (collapsed: boolean) => {
  if (collapsed) {
    document?.documentElement?.classList?.add('sidebar-collapsed')
  } else {
    document?.documentElement?.classList?.remove('sidebar-collapsed')
  }
}

// Apply on init
applySidebarClass(isCollapsed.value)

// Clean up global class only in Storybook (prevents class leak between stories).
// In production, sidebar is always present so cleanup during route navigation
// would cause a width flash (class removed before new sidebar re-adds it).
onUnmounted(() => {
  if (import.meta.env.STORYBOOK) {
    document?.documentElement?.classList?.remove('sidebar-collapsed')
  }
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  window?.localStorage?.setItem(LocalStorageKeys.SidebarCollapsed, String(isCollapsed.value))
  applySidebarClass(isCollapsed.value)
}

const openOverlay = async () => {
  isOverlayOpen.value = true
  await nextTick()
  closeBtn.value?.focus()
}

const closeOverlay = async (returnFocus = true) => {
  if (!isOverlayOpen.value) return
  isOverlayOpen.value = false
  if (returnFocus) {
    await nextTick()
    expandBtn.value?.focus()
  }
}

const expand = () => (isBelowXl.value ? openOverlay() : toggleCollapse())
const collapse = () => (isBelowXl.value ? closeOverlay() : toggleCollapse())

const onAsideKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOverlay.value) {
    e.stopPropagation()
    closeOverlay()
  }
}

// The overlay lifts the sidebar above the page header (see layout-base).
watch(isOverlay, (open) => document?.documentElement?.classList?.toggle('sidebar-overlay', open))
watch(isBelowXl, (below) => {
  if (!below) isOverlayOpen.value = false
})
watch(
  () => route.fullPath,
  () => closeOverlay(false)
)
onUnmounted(() => document?.documentElement?.classList?.remove('sidebar-overlay'))

// TODO: need to check why project is empty on first load
const isProjectLoading = computed(() => !activeProject.value)

onClickOutside(
  projectMenu,
  () => {
    isVisibleProjects.value = false
  },
  { ignore: [projectDd] }
)

onClickOutside(userMenu, () => {
  isVisibleProfile.value = false
})

// On a phone there is no room on the right: a menu opens below (the project
// list, at the top) or above (the user menu, at the bottom), kept inside the
// screen.
const fitBelow = [flip({ fallbackPlacements: ['bottom-start'] }), shift({ padding: 8 })]
const fitAbove = [flip({ fallbackPlacements: ['top-start'] }), shift({ padding: 8 })]

const { floatingStyles: projectDdStyles } = useFloating(projectDd, projectMenu, {
  placement: 'right-start',
  strategy: 'fixed',
  middleware: fitBelow
})

const { floatingStyles: userDdStyles } = useFloating(userDd, userMenu, {
  placement: 'right',
  strategy: 'fixed',
  middleware: fitAbove
})

const connectionStatus = computed(() => (isConnectedWS.value ? 'connected' : 'disconnected'))

// Self-update: a dot on Settings when something waits there; while the server
// restarts the connection shows as reconnecting, not as lost.
const updateStore = useServerUpdateStore()
const { hasAttention: hasUpdateAttention, attentionText: updateAttentionText } =
  storeToRefs(updateStore)
const isServerRestarting = computed(() => updateStore.phase === 'restarting')
const settingsLabel = computed(() =>
  hasUpdateAttention.value ? `Settings, ${updateAttentionText.value}` : 'Settings'
)

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

// Who is signed in, at the top of the user menu. Some providers send no
// email, some no name: the line that would repeat the other is left out.
const profileName = computed(() => profile.value?.username || profile.value?.email || '')
const profileEmail = computed(() => {
  const email = profile.value?.email || ''
  return email && email !== profileName.value ? email : ''
})

const connectionText = computed(() =>
  isServerRestarting.value
    ? 'The server is restarting'
    : `WS connection is ${connectionStatus.value}`
)
const connectionDotClass = computed(() => {
  if (isServerRestarting.value) return 'layout-sidebar__connection-dot--restarting'
  return isConnectedWS.value
    ? 'layout-sidebar__connection-dot--on'
    : 'layout-sidebar__connection-dot--off'
})
const connectionLabel = computed(() => {
  if (isServerRestarting.value) return 'Reconnecting'
  return isConnectedWS.value ? 'Connected' : 'Disconnected'
})

const userTrigger = ref<HTMLElement | undefined>()

const closeProfile = async (returnFocus = true) => {
  isVisibleProfile.value = false
  if (returnFocus) {
    await nextTick()
    userTrigger.value?.focus()
  }
}

const { onKeydown: onUserMenuKeydown, focusCurrent: focusFirstUserItem } = useMenuKeys(
  userMenu,
  () => closeProfile()
)

const toggleProfileDropdown = async () => {
  if (isVisibleProfile.value) return closeProfile()
  isVisibleProfile.value = true
  await nextTick()
  focusFirstUserItem()
}

const { onKeydown: onProjectMenuKeydown, focusCurrent: focusCurrentProject } = useMenuKeys(
  projectMenu,
  () => closeProjects()
)

const closeProjects = async (returnFocus = true) => {
  isVisibleProjects.value = false
  if (returnFocus) {
    await nextTick()
    projectDd.value?.focus()
  }
}

const toggleProjects = async () => {
  if (isVisibleProjects.value) return closeProjects()
  isVisibleProjects.value = true
  await nextTick()
  focusCurrentProject()
}

const logout = async () => {
  isVisibleProfile.value = false
  await profileStore.logout()
  router.push('/login')
}

const { availableEvents, hiddenMenuItems, isMockServerAvailable } = storeToRefs(useSettingsStore())

// Opens the Ctrl/⌘+K window: the way in without a keyboard.
const paletteKey = paletteKeyCaption()

const setProject = (projectKey: string) => {
  eventsStore.setActiveProjectKey(projectKey)

  closeProjects()
}

// The key line under a project's name only when it says something new.
const keyRepeatsName = (project: { key: string; name: string }) =>
  project.key.toLowerCase() === project.name.toLowerCase()

const projectSwitcherLabel = computed(
  () => `Project: ${activeProject.value?.name ?? ''}. Switch project`
)

// Groups of the event types this server has, minus those turned off in
// Settings › Menu (#5949); an empty group is left out.
const availableTypes = computed(() =>
  MENU_EVENT_GROUPS.flatMap((group) => group.types).filter((type) =>
    availableEvents.value.includes(type)
  )
)
const isShown = (id: string) => !hiddenMenuItems.value.includes(id)
const navGroups = computed(() =>
  MENU_EVENT_GROUPS.map((group) => ({
    ...group,
    types: group.types.filter((type) => availableEvents.value.includes(type) && isShown(type))
  })).filter((group) => group.types.length > 0)
)
const isMockServerShown = computed(
  () => isMockServerAvailable.value && isShown(MENU_TOOL_IDS.mockServer)
)
const isXdebugShown = computed(() => xdebugEnabled.value && isShown(MENU_TOOL_IDS.xdebug))
const isLogsShown = computed(
  () => availableEvents.value.includes(EventTypes.Monolog) && isShown(MENU_TOOL_IDS.logs)
)
const navTypesCount = computed(() => navGroups.value.reduce((n, g) => n + g.types.length, 0))


// A fade at the list's bottom edge while more of it is below the fold.
const scrollList = ref<HTMLElement | undefined>()
const hasMoreBelow = ref(false)
const updateMoreBelow = () => {
  const el = scrollList.value
  hasMoreBelow.value = !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 1
}
useResizeObserver(scrollList, updateMoreBelow)
// The box keeps its size when entries come or go: check again then too.
watch(
  () => [navTypesCount.value, isVisuallyCollapsed.value],
  () => nextTick(updateMoreBelow)
)

// One rule for every menu entry: the page it opens is the current one.
const isRouteActive = (name: RouteName) => route.name === name
const isTypeActive = (type: EventType) =>
  route.params.type === type || (type === 'sentry' && route.path.startsWith('/sentry'))

// «N new» since the person last looked at a type (blue, in both widths); the
// total (grey, expanded only, behind the «event counts» setting). What is on
// screen counts as seen: one type on its page, all of them on «All events».
const viewingTypes = computed<EventType[]>(() => {
  // Hidden types too, so they do not pile up «N new» while off.
  if (route.name === RouteName.Home) return availableTypes.value
  const type = availableTypes.value.find(isTypeActive)
  return type ? [type] : []
})
const { newCount } = useSeenEvents(viewingTypes)
const newBadge = (type: EventType) => {
  const n = newCount(type)
  const shown = n > 99 ? '99+' : String(n)
  return isVisuallyCollapsed.value ? shown : `${shown} new`
}

const hasEvents = (type: EventType) => getItemsCount.value(type) > 0
const linkLabel = (type: EventType) =>
  navLinkLabel(PAGES_SETTINGS[type].sidebarTitle, getItemsCount.value(type), newCount(type))
</script>

<template>
  <div
    v-if="isOverlay"
    class="layout-sidebar__backdrop"
    data-test="sidebar-backdrop"
    @click="closeOverlay()"
  />

  <aside
    class="layout-sidebar"
    :class="{
      'layout-sidebar--collapsed': isVisuallyCollapsed,
      'layout-sidebar--overlay': isOverlay
    }"
    @keydown="onAsideKeydown"
  >
    <nav
      class="layout-sidebar__nav"
      aria-label="Main"
    >
      <!-- Logo + collapse toggle header -->
      <div class="layout-sidebar__header">
        <RouterLink
          :to="{ name: RouteName.Home }"
          title="Home"
          aria-label="Home"
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
          ref="closeBtn"
          class="layout-sidebar__toggle-btn"
          :title="isOverlay ? 'Close menu' : 'Collapse sidebar'"
          :aria-label="isOverlay ? 'Close menu' : 'Collapse sidebar'"
          @click="collapse"
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
            data-test="project-switcher"
            aria-haspopup="menu"
            :aria-expanded="isVisibleProjects"
            :aria-label="projectSwitcherLabel"
            :title="activeProject.name"
            @click="toggleProjects"
          >
            <ProjectAvatar
              class="layout-sidebar__project"
              :project-key="activeProject.key"
            />
            <span class="layout-sidebar__project-name">{{ activeProject.name }}</span>
            <svg
              class="layout-sidebar__project-chevron"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <hr class="layout-sidebar__sep">
      </template>

      <!-- Event types, tools: scrolls when the screen is short -->
      <div
        ref="scrollList"
        class="layout-sidebar__scroll"
        :class="{ 'layout-sidebar__scroll--more': hasMoreBelow }"
        @scroll.passive="updateMoreBelow"
      >
        <button
          type="button"
          class="layout-sidebar__link layout-sidebar__goto"
          :title="`Go to… (${paletteKey})`"
          aria-label="Go to a page, project, setting or action"
          aria-keyshortcuts="Control+K Meta+K"
          aria-haspopup="dialog"
          data-test="open-palette"
          @click="isCommandPaletteOpen = true"
        >
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              name="search"
            />
          </span>
          <span class="layout-sidebar__link-label">Go to…</span>
          <kbd class="layout-sidebar__goto-key">{{ paletteKey }}</kbd>
        </button>

        <RouterLink
          :to="{ name: RouteName.Home }"
          title="Events"
          aria-label="All events"
          class="layout-sidebar__link"
          :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.Home) }"
        >
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              name="events"
            />
          </span>
          <span class="layout-sidebar__link-label">All events</span>
        </RouterLink>

        <div
          v-for="group in navGroups"
          :key="group.id"
          role="group"
          :aria-labelledby="`nav-group-${group.id}`"
          class="layout-sidebar__group"
        >
          <p
            :id="`nav-group-${group.id}`"
            class="layout-sidebar__group-title"
          >
            {{ group.title }}
          </p>

          <RouterLink
            v-for="type in group.types"
            :key="type"
            :to="typePageLink(type)"
            :class="{
              'layout-sidebar__link--active': isTypeActive(type),
              'layout-sidebar__link--empty': !hasEvents(type)
            }"
            :title="PAGES_SETTINGS[type].sidebarTitle"
            :aria-label="linkLabel(type)"
            class="layout-sidebar__link"
          >
            <span class="layout-sidebar__link-icon-wrap">
              <IconSvg
                class="layout-sidebar__link-icon"
                :name="PAGES_SETTINGS[type].iconName"
              />
            </span>
            <span class="layout-sidebar__link-label">{{ PAGES_SETTINGS[type].sidebarTitle }}</span>
            <span
              v-if="newCount(type) > 0"
              class="layout-sidebar__new-count"
              data-test="nav-new"
            >{{
              newBadge(type)
            }}</span>
            <span
              v-if="isVisibleEventCounts && hasEvents(type)"
              class="layout-sidebar__count"
            >
              {{ getItemsCount(type) > 99 ? '99+' : getItemsCount(type) }}
            </span>
          </RouterLink>
        </div>

        <div
          v-if="isLogsShown || isMockServerShown || isXdebugShown"
          role="group"
          aria-labelledby="nav-group-tools"
          class="layout-sidebar__group"
        >
          <p
            id="nav-group-tools"
            class="layout-sidebar__group-title"
          >
            Tools
          </p>

          <RouterLink
            v-if="isLogsShown"
            :to="{ name: RouteName.Logs }"
            title="Logs"
            aria-label="Logs"
            class="layout-sidebar__link"
            :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.Logs) }"
            data-test="nav-logs"
          >
            <span class="layout-sidebar__link-icon-wrap">
              <IconSvg
                class="layout-sidebar__link-icon"
                name="monolog"
              />
            </span>
            <span class="layout-sidebar__link-label">Logs</span>
            <span class="layout-sidebar__new">new</span>
          </RouterLink>

          <RouterLink
            v-if="isMockServerShown"
            :to="{ name: RouteName.MockServer }"
            title="Mock server"
            aria-label="Mock server"
            class="layout-sidebar__link"
            :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.MockServer) }"
          >
            <span class="layout-sidebar__link-icon-wrap">
              <IconSvg
                class="layout-sidebar__link-icon"
                name="mock-server"
              />
            </span>
            <span class="layout-sidebar__link-label">Mock server</span>
            <span class="layout-sidebar__new">new</span>
          </RouterLink>

          <RouterLink
            v-if="isXdebugShown"
            :to="{ name: RouteName.Xdebug }"
            title="Xdebug"
            aria-label="Xdebug"
            class="layout-sidebar__link"
            :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.Xdebug) }"
          >
            <span class="layout-sidebar__link-icon-wrap">
              <IconSvg
                class="layout-sidebar__link-icon"
                name="bug"
              />
            </span>
            <span class="layout-sidebar__link-label">Xdebug</span>
            <span class="layout-sidebar__new">new</span>
          </RouterLink>
        </div>
      </div>

      <!-- Pinned: always in view, however short the screen -->
      <div class="layout-sidebar__pinned">
        <RouterLink
          :to="{ name: RouteName.Favorites }"
          title="Favorites"
          aria-label="Favorites"
          class="layout-sidebar__link"
          :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.Favorites) }"
        >
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              name="pin"
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
          :to="{ name: RouteName.Settings, hash: hasUpdateAttention ? '#updates' : undefined }"
          title="Settings"
          :aria-label="settingsLabel"
          class="layout-sidebar__link"
          :class="{ 'layout-sidebar__link--active': isRouteActive(RouteName.Settings) }"
        >
          <span class="layout-sidebar__link-icon-wrap">
            <IconSvg
              class="layout-sidebar__link-icon"
              name="settings"
            />
            <span
              v-if="hasUpdateAttention"
              class="layout-sidebar__update-dot"
              data-test="settings-update-dot"
            />
          </span>
          <span class="layout-sidebar__link-label">Settings</span>
        </RouterLink>
      </div>
    </nav>

    <!-- The sidebar's menus live in <body>: above the page header whatever
         the layout does (#6795), and out of the nav's overflow. -->
    <Teleport to="body">
      <div
        v-if="isVisibleProjects"
        ref="projectMenu"
        role="menu"
        aria-label="Project list"
        class="layout-sidebar__dropdown-items"
        :style="projectDdStyles"
        @keydown="onProjectMenuKeydown"
      >
        <button
          v-for="project in availableProjects"
          :key="project.key"
          class="layout-sidebar__dropdown-item"
          role="menuitemradio"
          :title="project.name"
          :aria-checked="activeProject.key === project.key ? 'true' : 'false'"
          :aria-current="activeProject.key === project.key ? 'true' : undefined"
          :class="{
            'layout-sidebar__dropdown-item--active': activeProject.key === project.key
          }"
          tabindex="-1"
          @click="setProject(project.key)"
        >
          <ProjectAvatar
            class="layout-sidebar__project"
            :project-key="project.key"
          />

          <div class="layout-sidebar__dropdown-item-text">
            <span
              v-if="!keyRepeatsName(project)"
              class="layout-sidebar__dropdown-item-text-key"
            >
              {{ project.key }}
            </span>
            {{ project.name }}
          </div>

          <svg
            v-if="activeProject.key === project.key"
            class="layout-sidebar__dropdown-item-check"
            data-test="project-current"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path
              d="M3.5 8.5l3 3 6-7"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <p
          class="layout-sidebar__dropdown-hint"
          aria-hidden="true"
        >
          ↑↓ choose · Enter open · Esc close
        </p>
      </div>
    </Teleport>

    <div class="layout-sidebar__bottom">
      <div
        v-if="isAuthEnabled"
        ref="userDd"
        class="layout-sidebar__user"
      >
        <Teleport to="body">
          <div
            v-if="isVisibleProfile"
            ref="userMenu"
            role="menu"
            aria-label="User menu"
            class="layout-sidebar__dropdown-items"
            :style="userDdStyles"
            @keydown="onUserMenuKeydown"
          >
            <div
              v-if="profileName"
              class="layout-sidebar__user-who"
              data-test="user-menu-who"
            >
              <span class="layout-sidebar__user-name">{{ profileName }}</span>
              <span
                v-if="profileEmail"
                class="layout-sidebar__user-email"
              >{{ profileEmail }}</span>
            </div>
            <RouterLink
              v-if="isAdmin"
              role="menuitem"
              class="layout-sidebar__dropdown-item"
              :to="{ name: RouteName.Audit }"
              @click="closeProfile(false)"
            >
              <IconSvg
                class="layout-sidebar__dropdown-item-icon"
                name="lock"
              />
              Audit log
            </RouterLink>
            <button
              role="menuitem"
              class="layout-sidebar__dropdown-item"
              @click="logout"
            >
              <IconSvg
                class="layout-sidebar__dropdown-item-icon"
                name="logout"
              />
              Logout
            </button>
          </div>
        </Teleport>

        <div
          v-if="profile"
          ref="userTrigger"
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
          <UserAvatar
            class="layout-sidebar__user-avatar"
            :src="avatar"
            :name="profile.username || profile.email"
            :size="32"
          />
        </div>
      </div>

      <!-- Expand button (collapsed mode) -->
      <template v-if="isVisuallyCollapsed">
        <button
          ref="expandBtn"
          class="layout-sidebar__expand-btn"
          title="Expand sidebar"
          aria-label="Expand sidebar"
          :aria-expanded="false"
          @click="expand"
        >
          <IconSvg
            class="layout-sidebar__toggle-icon"
            name="sidebar-left"
          />
        </button>

        <hr class="layout-sidebar__sep layout-sidebar__sep--full">
      </template>

      <!-- Connection indicator -->
      <div
        class="layout-sidebar__connection"
        :title="connectionText"
      >
        <span
          class="layout-sidebar__connection-dot"
          :class="connectionDotClass"
        />
        <span class="layout-sidebar__connection-label">
          {{ connectionLabel }}
        </span>
      </div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  @apply bg-gray-100 dark:bg-gray-900;
  @apply flex flex-col h-full;
  @apply border-r border-gray-200 dark:border-gray-800;
  @apply relative;
}

/* Below 1280 px the expanded menu lies over the page; layout-base lifts its
   wrapper above the header while html.sidebar-overlay is set. */
.layout-sidebar--overlay {
  @apply fixed top-0 bottom-0 left-0 w-56 shadow-2xl;
  max-width: calc(100vw - 48px);
  z-index: 2;
}

.layout-sidebar__backdrop {
  @apply fixed inset-0 bg-gray-900/40;
  z-index: 1;
}

.layout-sidebar__nav {
  @apply flex flex-col flex-1 min-h-0;
  @apply pt-1;
}

/* The list scrolls; Favorites and Settings below it stay in view. */
.layout-sidebar__scroll {
  @apply flex flex-col flex-1 min-h-0 pb-1;
  @apply overflow-y-auto overflow-x-hidden overscroll-contain;
  scrollbar-width: thin;
}

.layout-sidebar__scroll--more {
  mask-image: linear-gradient(to bottom, #000 calc(100% - 24px), transparent);
}

.layout-sidebar__pinned {
  @apply flex flex-col flex-none py-1;
  border-top: 1px solid rgba(128, 128, 128, 0.08);
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
  @apply w-9 h-9 rounded-md;
  @apply text-gray-500 dark:text-gray-400;
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
  @apply w-5 h-5;
}

/* ---- Expand button (collapsed mode, in bottom section) ---- */
.layout-sidebar__expand-btn {
  @apply flex items-center justify-center;
  @apply w-9 h-9 mx-auto rounded-md;
  @apply text-gray-500 dark:text-gray-400;
  @apply hover:text-gray-600 dark:hover:text-gray-300;
  @apply hover:bg-gray-200/60 dark:hover:bg-white/5;
  @apply transition-colors duration-100 cursor-pointer;
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
    @apply justify-start pl-3 pr-2;
    @apply hover:bg-gray-200/50 dark:hover:bg-white/5;
  }

  /* Collapsed mode: no full-width highlight, icon-wrap gets it */
  .layout-sidebar--collapsed & {
    @apply hover:bg-transparent dark:hover:bg-transparent;
  }

  .layout-sidebar__projects & {
    @apply p-2;
  }

  /* Phone, menu open over the page: 44 px rows for a finger. */
  @media (max-width: 639px) {
    .layout-sidebar--overlay & {
      min-height: 44px;
    }
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
  @apply hidden text-sm font-medium truncate ml-2.5 flex-1 min-w-0;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline;
  }
}

.layout-sidebar__new {
  @apply hidden ml-auto px-1.5 py-0.5 rounded-full text-[10px] leading-none font-medium;
  @apply bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline-block;
  }
}

.layout-sidebar__goto {
  @apply w-full text-left;
}

.layout-sidebar__goto-key {
  @apply hidden ml-auto flex-shrink-0 font-mono text-[10px] leading-none px-1 py-0.5 rounded;
  @apply border border-gray-300 dark:border-gray-600;
  @apply text-gray-500 dark:text-gray-400;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline-block;
  }
}

.layout-sidebar__count {
  @apply hidden text-[10px] font-mono tabular-nums leading-none flex-shrink-0;
  @apply min-w-[18px] text-center px-1 py-0.5 rounded-full;
  @apply bg-gray-200/80 dark:bg-white/5;
  @apply text-gray-500 dark:text-gray-400;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline-block;
  }
}

/* ---- Groups ---- */
.layout-sidebar__group {
  @apply flex flex-col;

  & + & {
    @apply mt-1;
  }

  /* Collapsed: a thin line between groups instead of the titles. */
  .layout-sidebar--collapsed & + &::before {
    content: '';
    @apply block mx-auto my-1 w-6 h-px;
    background-color: rgba(128, 128, 128, 0.25);
  }
}

.layout-sidebar__group-title {
  @apply hidden px-4 pt-2 pb-1;
  // The owner's size (#5935): small labels that do not compete with the items;
  // gray-600 keeps ≥4.5:1 on the light sidebar (gray-500 gave 4.39:1).
  @apply text-[.55rem] leading-4 font-semibold uppercase tracking-wider;
  @apply text-gray-600 dark:text-gray-400;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply block;
  }
}

/* «N new» since the last look: blue, in both widths. Collapsed: a number on
   the icon's corner. */
.layout-sidebar__new-count {
  @apply ml-1 mr-1 px-1.5 py-0.5 rounded-full flex-shrink-0;
  @apply text-[10px] leading-none font-semibold tabular-nums whitespace-nowrap;
  @apply bg-blue-600 text-white;

  .layout-sidebar--collapsed & {
    @apply absolute m-0 px-1 min-w-[16px] text-center;
    top: 2px;
    right: calc(50% - 22px);
    box-shadow: 0 0 0 2px theme('colors.gray.100');

    .dark & {
      box-shadow: 0 0 0 2px theme('colors.gray.900');
    }
  }
}

/* A type with no events: the icon steps back; the name keeps its contrast. */
.layout-sidebar__link--empty:not(.layout-sidebar__link--active) .layout-sidebar__link-icon {
  @apply opacity-40;
}

.layout-sidebar__link--active {
  @apply text-gray-900 dark:text-gray-50;

  /* The current page: a blue bar on the left, in both widths. */
  &::before {
    content: '';
    @apply absolute left-0 w-[3px] rounded-r-sm;
    @apply bg-blue-600 dark:bg-blue-400;
    top: 6px;
    bottom: 6px;
  }

  /* Expanded: full-width bg */
  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply bg-gray-200 dark:bg-white/10;
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

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply items-stretch px-2;
  }
}

.layout-sidebar__project-name {
  @apply hidden flex-1 min-w-0 truncate text-left text-sm font-medium;
  @apply text-gray-800 dark:text-gray-100;
}

.layout-sidebar__project-chevron {
  @apply hidden w-4 h-4 flex-shrink-0;
  @apply text-gray-500 dark:text-gray-400;
}

.layout-sidebar__project {
  @apply h-7 w-7;
}

/* ---- Dropdown ---- */
.layout-sidebar__dropdown {
  @apply h-10;
  @apply p-2;
  @apply flex items-center justify-center;
  @apply relative cursor-pointer;

  /* Expanded: the project's colour chip, its name and a chevron. */
  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply justify-start gap-2 w-full rounded-md;
    @apply hover:bg-gray-200/60 dark:hover:bg-white/5;

    .layout-sidebar__project-name {
      @apply block;
    }

    .layout-sidebar__project-chevron {
      @apply block;
    }
  }
}

.layout-sidebar__dropdown-hint {
  @apply px-4 py-2 text-2xs text-gray-500 dark:text-gray-400;
}

.layout-sidebar__dropdown-items {
  @apply z-popover;
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

.layout-sidebar__dropdown-item-check {
  @apply w-4 h-4 ml-auto flex-shrink-0;
  @apply text-blue-600 dark:text-blue-400;
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

/* Who is signed in: a plain label, not an action (#6798) — no hand cursor,
   no hover, no tab stop; the text can be selected and copied. */
.layout-sidebar__user-who {
  @apply flex flex-col gap-0.5 px-4 py-2.5 max-w-72;
  @apply cursor-default select-text;
}

.layout-sidebar__user-name {
  @apply text-sm font-medium truncate;
  @apply text-gray-900 dark:text-gray-100;
}

.layout-sidebar__user-email {
  @apply text-xs truncate;
  @apply text-gray-500 dark:text-gray-400;
}

.layout-sidebar__user-avatar {
  @apply hover:opacity-75;
  @apply cursor-pointer;
}

/* ---- Bottom section ---- */
.layout-sidebar__bottom {
  @apply px-3 py-2;
  border-top: 1px solid rgba(128, 128, 128, 0.08);
}

.layout-sidebar__sep--full {
  margin-left: -12px;
  margin-right: -12px;
  width: calc(100% + 24px);
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

.layout-sidebar__connection-dot--restarting {
  @apply bg-amber-500 dark:bg-amber-400;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
  animation: layout-sidebar-blink 1s infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes layout-sidebar-blink {
  50% {
    opacity: 0.3;
  }
}

/* Settings: an update waits there. Shown in both sidebar widths; the link's
   aria-label says it. */
.layout-sidebar__update-dot {
  @apply absolute w-2 h-2 rounded-full;
  @apply bg-blue-600 dark:bg-blue-400;
  top: -1px;
  right: -2px;
  box-shadow: 0 0 0 2px theme('colors.gray.100');

  .dark & {
    box-shadow: 0 0 0 2px theme('colors.gray.900');
  }
}

.layout-sidebar__connection-label {
  @apply hidden text-xs text-gray-500 dark:text-gray-400;

  .layout-sidebar:not(.layout-sidebar--collapsed) & {
    @apply inline;
  }
}
</style>
