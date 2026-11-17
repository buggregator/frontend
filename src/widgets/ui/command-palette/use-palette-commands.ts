import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServerUpdateStore } from '@/entities/server-update'
import { useXdebugEnabled } from '@/entities/xdebug'
import { MENU_EVENT_GROUPS, PAGES_SETTINGS, SETTINGS_SECTIONS } from '@/shared/constants'
import type { Command } from '@/shared/lib/command-palette'
import { useEvents } from '@/shared/lib/use-events'
import { isShortcutsOverlayOpen } from '@/shared/lib/use-global-shortcuts'
import { useSeenEvents } from '@/shared/lib/use-seen-events'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'

// Words people look for an event type by: not shown.
const TYPE_KEYWORDS: Partial<Record<string, string[]>> = {
  sentry: ['errors', 'exceptions', 'crash'],
  profiler: ['performance', 'xhprof', 'slow'],
  inspector: ['apm', 'performance'],
  smtp: ['mail', 'email'],
  sms: ['text message', 'phone'],
  'http-dump': ['request', 'webhook'],
  'var-dump': ['dump', 'symfony'],
  monolog: ['logs', 'logging'],
  ray: ['debug', 'spatie'],
  'xdebug-trace': ['trace', 'xdebug']
}

// Everything the Ctrl/⌘+K window offers, from the same sources as the menu
// and the Settings page, so it cannot drift from them.
export const usePaletteCommands = () => {
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const { availableEvents, themeMode, isMockServerAvailable } = storeToRefs(settingsStore)
  const eventsStore = useEventsStore()
  const { availableProjects, isMultipleProjects, activeProject } = storeToRefs(eventsStore)
  const updateStore = useServerUpdateStore()
  const xdebugEnabled = useXdebugEnabled()
  const { events, lockedIds } = useEvents()
  // Counts only: nothing on screen is marked as seen from here.
  const { newCount } = useSeenEvents(ref([]))

  const pages = computed<Command[]>(() => [
    {
      id: 'page-home',
      group: 'pages',
      label: 'All events',
      keywords: ['home'],
      icon: 'events',
      run: () => router.push({ name: RouteName.Home })
    },
    ...MENU_EVENT_GROUPS.flatMap((group) => group.types)
      .filter((type) => availableEvents.value.includes(type))
      .map<Command>((type) => {
        const n = newCount(type)
        return {
          id: `page-${type}`,
          group: 'pages',
          label: PAGES_SETTINGS[type].sidebarTitle,
          note: n > 0 ? `${n > 99 ? '99+' : n} new` : undefined,
          keywords: [PAGES_SETTINGS[type].title, type, ...(TYPE_KEYWORDS[type] ?? [])],
          icon: PAGES_SETTINGS[type].iconName,
          run: () =>
            router.push(
              type === 'sentry' ? '/sentry/exceptions' : { name: RouteName.EventList, params: { type } }
            )
        }
      }),
    {
      id: 'page-favorites',
      group: 'pages',
      label: 'Favorites',
      keywords: ['pinned'],
      icon: 'pin',
      run: () => router.push({ name: RouteName.Favorites })
    },
    ...(isMockServerAvailable.value
      ? [
          <Command>{
            id: 'page-mock-server',
            group: 'pages',
            label: 'Mock server',
            icon: 'mock-server',
            run: () => router.push({ name: RouteName.MockServer })
          }
        ]
      : []),
    ...(xdebugEnabled.value
      ? [
          {
            id: 'page-xdebug',
            group: 'pages',
            label: 'Xdebug',
            icon: 'bug',
            run: () => router.push({ name: RouteName.Xdebug })
          } satisfies Command
        ]
      : []),
    {
      id: 'page-settings',
      group: 'pages',
      label: 'Settings',
      icon: 'settings',
      run: () => router.push({ name: RouteName.Settings })
    }
  ])

  const projects = computed<Command[]>(() =>
    isMultipleProjects.value
      ? availableProjects.value.map((project) => ({
          id: `project-${project.key}`,
          group: 'projects',
          label: project.name,
          note: project.key === activeProject.value?.key ? 'current' : undefined,
          keywords: [project.key, 'project'],
          run: () => eventsStore.setActiveProjectKey(project.key)
        }))
      : []
  )

  const settings = computed<Command[]>(() =>
    SETTINGS_SECTIONS.flatMap((section) =>
      section.items.map<Command>((item) => ({
        id: `setting-${item.id}`,
        group: 'settings',
        label: item.label,
        note: section.title !== item.label ? section.title : undefined,
        keywords: [item.hint, ...(item.keywords ?? [])],
        run: () => router.push({ name: RouteName.Settings, hash: `#${section.id}` })
      }))
    )
  )

  const canCheckUpdates = computed(
    () => updateStore.supported === true && updateStore.status?.check_enabled !== false
  )

  // Clear cannot be undone: it asks first, like the Clear button.
  const clearAll = () => {
    const pinned = lockedIds.items.value.length > 0 ? ' Pinned events stay.' : ''
    if (window.confirm(`Delete all events in this project? This cannot be undone.${pinned}`)) {
      events.removeAll()
    }
  }

  const themeCommand = (mode: 'light' | 'dark' | 'system', label: string): Command => ({
    id: `theme-${mode}`,
    group: 'actions',
    label: `Theme: ${label}`,
    note: themeMode.value === mode ? 'current' : undefined,
    keywords: ['appearance', 'color', 'mode'],
    run: () => settingsStore.setThemeMode(mode)
  })

  const actions = computed<Command[]>(() => [
    {
      id: 'action-clear',
      group: 'actions',
      label: 'Clear all events',
      keywords: ['delete', 'remove'],
      icon: 'trash-bin',
      run: clearAll
    },
    ...(canCheckUpdates.value
      ? [
          {
            id: 'action-check-updates',
            group: 'actions',
            label: 'Check for updates',
            keywords: ['version', 'upgrade', 'release'],
            run: () => {
              router.push({ name: RouteName.Settings, hash: '#updates' })
              updateStore.check()
            }
          } satisfies Command
        ]
      : []),
    themeCommand('light', 'Light'),
    themeCommand('dark', 'Dark'),
    themeCommand('system', 'System'),
    {
      id: 'action-shortcuts',
      group: 'actions',
      label: 'Keyboard shortcuts',
      keywords: ['keys', 'help', 'hotkeys'],
      run: () => {
        isShortcutsOverlayOpen.value = true
      }
    }
  ])

  return computed(() => [...pages.value, ...projects.value, ...settings.value, ...actions.value])
}
