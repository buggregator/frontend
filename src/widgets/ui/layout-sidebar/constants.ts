import { EventTypes } from '@/shared/types'

// The menu's event types, in groups (idea 2, #5871). The number shortcuts
// (1–9) keep their own order in shared/lib/shortcuts.
export const EVENTS_NAV_GROUPS: { id: string; title: string; types: EventTypes[] }[] = [
  {
    id: 'errors',
    title: 'Errors & performance',
    types: [EventTypes.Sentry, EventTypes.Profiler, EventTypes.Inspector],
  },
  {
    id: 'dumps',
    title: 'Dumps',
    types: [EventTypes.RayDump, EventTypes.HttpDump, EventTypes.VarDump, EventTypes.XdebugTrace],
  },
  {
    id: 'mail-logs',
    title: 'Mail & logs',
    types: [EventTypes.Smtp, EventTypes.Sms, EventTypes.Monolog],
  },
]
