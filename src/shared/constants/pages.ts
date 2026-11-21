import type { RouteLocationRaw } from 'vue-router'
import { EventTypes, RouteName, type OneOfValues } from "../types";

export const ALL_EVENT_TYPES = 'all-events' as const

export const PAGE_TYPES = {
  ...EventTypes,
  ALL_EVENT_TYPES,
} as const

export const PAGES_SETTINGS: { [key in OneOfValues<typeof PAGE_TYPES> ]: { title: string, sidebarTitle: string, iconName: string, eventType: EventTypes | typeof ALL_EVENT_TYPES }} = {
  [PAGE_TYPES.ALL_EVENT_TYPES]: {
    title: 'Home',
    sidebarTitle: 'Home',
    iconName: 'home',
    eventType: ALL_EVENT_TYPES,
  },
  [PAGE_TYPES.Sentry]: {
    title: 'Sentry',
    sidebarTitle: 'Sentry',
    iconName: 'sentry',
    eventType: EventTypes.Sentry,
  },
  [PAGE_TYPES.Profiler]: {
    title: 'Profiler',
    sidebarTitle: 'Profiler',
    iconName: 'profiler',
    eventType: EventTypes.Profiler,
  },
  [PAGE_TYPES.Smtp]: {
    title: 'SMTP',
    sidebarTitle: 'SMTP',
    iconName: 'smtp',
    eventType: EventTypes.Smtp,
  },
  [PAGE_TYPES.HttpDump]: {
    title: 'Http Dump',
    sidebarTitle: 'HTTP dumps',
    iconName: 'http-dump',
    eventType: EventTypes.HttpDump,
  },
  [PAGE_TYPES.Inspector]: {
    title: 'Inspector',
    sidebarTitle: 'Inspector',
    iconName: 'inspector',
    eventType: EventTypes.Inspector,
  },
  [PAGE_TYPES.VarDump]: {
    title: 'Var Dump',
    sidebarTitle: 'Var dumps',
    iconName: 'var-dump',
    eventType: EventTypes.VarDump,
  },
  [PAGE_TYPES.Monolog]: {
    title: 'Monolog',
    sidebarTitle: 'Monolog',
    iconName: 'monolog',
    eventType: EventTypes.Monolog,
  },
  [PAGE_TYPES.RayDump]: {
    title: 'Ray Dump',
    sidebarTitle: 'Ray',
    iconName: 'ray',
    eventType: EventTypes.RayDump,
  },
  [PAGE_TYPES.Sms]: {
    title: 'SMS',
    sidebarTitle: 'SMS',
    iconName: 'sms',
    eventType: EventTypes.Sms,
  },
  [PAGE_TYPES.Broadcast]: {
    title: 'Broadcast',
    sidebarTitle: 'Broadcast',
    iconName: 'broadcast',
    eventType: EventTypes.Broadcast,
  },
  [PAGE_TYPES.SentryTrace]: {
    title: 'Sentry Traces',
    sidebarTitle: 'Sentry traces',
    iconName: 'sentry',
    eventType: EventTypes.SentryTrace,
  },
  [PAGE_TYPES.SentryLog]: {
    title: 'Sentry Logs',
    sidebarTitle: 'Sentry logs',
    iconName: 'sentry',
    eventType: EventTypes.SentryLog,
  },
  [PAGE_TYPES.XdebugTrace]: {
    title: 'Xdebug Trace',
    sidebarTitle: 'Xdebug traces',
    iconName: 'trace',
    eventType: EventTypes.XdebugTrace,
  }
}

// Where a type's menu entry leads. Sentry and Broadcast have pages of their
// own; a named EventList link would open the plain feed for them.
export const typePageLink = (type: string): RouteLocationRaw => {
  if (type === EventTypes.Sentry) return '/sentry/exceptions'
  if (type === EventTypes.Broadcast) return '/broadcast'
  return { name: RouteName.EventList, params: { type } }
}
