import { PAGES_SETTINGS } from '../../constants/pages'
import { EventTypes } from '../../types'

// The one list of keyboard shortcuts. Handlers look keys up here, and the
// «Keyboard shortcuts» dialog lists it, so the two cannot drift apart.

export type ShortcutGroupId = 'everywhere' | 'event-list' | 'sentry-breadcrumbs' | 'search'

export const SHORTCUT_GROUPS: { id: ShortcutGroupId, title: string }[] = [
  { id: 'everywhere', title: 'Everywhere' },
  { id: 'event-list', title: 'Event list' },
  { id: 'sentry-breadcrumbs', title: 'Sentry event: breadcrumbs' },
  { id: 'search', title: 'Search box' },
]

// Event types in the order of the digit keys 1–9 (the sidebar order).
export const NAV_TYPES: EventTypes[] = [
  EventTypes.Sentry,
  EventTypes.Profiler,
  EventTypes.Smtp,
  EventTypes.Sms,
  EventTypes.HttpDump,
  EventTypes.Inspector,
  EventTypes.VarDump,
  EventTypes.Monolog,
  EventTypes.RayDump,
]

export type Shortcut = {
  id: string
  group: ShortcutGroupId
  keys: string[]     // KeyboardEvent.key values that trigger it
  caps?: string[]    // what the dialog shows, when it differs from keys
  label: string
  singleKey: boolean // off with the «Single-key shortcuts» setting
}

const navShortcuts: Shortcut[] = NAV_TYPES.map((type, i) => ({
  id: `go-${type}`,
  group: 'everywhere',
  keys: [String(i + 1)],
  label: PAGES_SETTINGS[type].title,
  singleKey: true,
}))

export const SHORTCUTS: Shortcut[] = [
  { id: 'help', group: 'everywhere', keys: ['?'], label: 'Show this list', singleKey: true },
  { id: 'go-home', group: 'everywhere', keys: ['0'], label: 'All events', singleKey: true },
  { id: 'go-favorites', group: 'everywhere', keys: ['f'], label: 'Favorites', singleKey: true },
  ...navShortcuts,

  { id: 'list-next', group: 'event-list', keys: ['j', 'ArrowDown'], caps: ['j', '↓'], label: 'Next event', singleKey: true },
  { id: 'list-prev', group: 'event-list', keys: ['k', 'ArrowUp'], caps: ['k', '↑'], label: 'Previous event', singleKey: true },
  { id: 'list-open', group: 'event-list', keys: ['Enter'], label: 'Open event', singleKey: true },
  { id: 'list-delete', group: 'event-list', keys: ['x'], label: 'Delete event', singleKey: true },
  { id: 'list-pin', group: 'event-list', keys: ['l'], label: 'Pin / unpin event', singleKey: true },
  { id: 'list-copy', group: 'event-list', keys: ['y'], label: 'Copy payload to clipboard', singleKey: true },
  { id: 'list-screenshot', group: 'event-list', keys: ['s'], label: 'Screenshot to clipboard', singleKey: true },
  { id: 'list-clear', group: 'event-list', keys: ['Escape'], caps: ['Esc'], label: 'Clear selection', singleKey: true },

  { id: 'crumbs-prev', group: 'sentry-breadcrumbs', keys: ['k', 'ArrowUp'], caps: ['k', '↑'], label: 'Previous breadcrumb', singleKey: false },
  { id: 'crumbs-next', group: 'sentry-breadcrumbs', keys: ['j', 'ArrowDown'], caps: ['j', '↓'], label: 'Next breadcrumb', singleKey: false },
  { id: 'crumbs-close', group: 'sentry-breadcrumbs', keys: ['Escape'], caps: ['Esc'], label: 'Close details', singleKey: false },

  { id: 'search-focus', group: 'search', keys: ['/'], label: 'Focus the search box', singleKey: true },
  { id: 'search-clear', group: 'search', keys: ['Escape'], caps: ['Esc'], label: 'Clear and leave the search box', singleKey: false },
]

// The shortcut a key triggers in a group, or null.
export const shortcutFor = (group: ShortcutGroupId, key: string): string | null =>
  SHORTCUTS.find((s) => s.group === group && s.keys.includes(key))?.id ?? null

export const shortcutsIn = (group: ShortcutGroupId): Shortcut[] => SHORTCUTS.filter((s) => s.group === group)

export const capsOf = (s: Shortcut): string[] => s.caps ?? s.keys
