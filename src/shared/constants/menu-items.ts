import { EventTypes } from '../types'
import { PAGES_SETTINGS } from './pages'

// The left menu's switchable entries, in menu order: one home for the sidebar,
// the Ctrl/⌘+K window and Settings › Menu (#5949). All events, Favorites and
// Settings are always shown.

// The menu's event types, in groups (idea 2, #5871). The number shortcuts
// (1–9) keep their own order in shared/lib/shortcuts.
export const MENU_EVENT_GROUPS: { id: string; title: string; types: EventTypes[] }[] = [
  {
    id: 'errors',
    title: 'Errors & performance',
    types: [EventTypes.Sentry, EventTypes.Profiler, EventTypes.Inspector, EventTypes.Csp]
  },
  {
    id: 'dumps',
    title: 'Dumps',
    types: [EventTypes.RayDump, EventTypes.HttpDump, EventTypes.VarDump, EventTypes.XdebugTrace]
  },
  {
    id: 'mail-logs',
    title: 'Mail & logs',
    types: [EventTypes.Smtp, EventTypes.Sms, EventTypes.Broadcast, EventTypes.Monolog]
  }
]

export const MENU_TOOL_IDS = {
  mockServer: 'mock-server',
  xdebug: 'xdebug'
} as const

export type MenuItem = {
  // An event type or a MENU_TOOL_IDS value.
  id: string
  label: string
  groupTitle: string
}

export const MENU_ITEMS: MenuItem[] = [
  ...MENU_EVENT_GROUPS.flatMap((group) =>
    group.types.map((type) => ({
      id: type,
      label: PAGES_SETTINGS[type].sidebarTitle,
      groupTitle: group.title
    }))
  ),
  { id: MENU_TOOL_IDS.mockServer, label: 'Mock server', groupTitle: 'Tools' },
  { id: MENU_TOOL_IDS.xdebug, label: 'Xdebug', groupTitle: 'Tools' }
]
