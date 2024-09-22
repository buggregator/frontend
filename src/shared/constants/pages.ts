import { EventTypes, type OneOfValues } from '../types'

export const ALL_EVENT_TYPES = 'all-events' as const

export const PAGE_TYPES = {
  ...EventTypes,
  ALL_EVENT_TYPES
} as const

export const PAGES_SETTINGS: {
  [key in OneOfValues<typeof PAGE_TYPES>]: {
    title: string
    sidebarTitle: string
    iconName: string
    eventType: EventTypes | typeof ALL_EVENT_TYPES
  }
} = {
  [PAGE_TYPES.ALL_EVENT_TYPES]: {
    title: 'Home',
    sidebarTitle: 'Home',
    iconName: 'home',
    eventType: ALL_EVENT_TYPES
  },
  [PAGE_TYPES.Sentry]: {
    title: 'Sentry',
    sidebarTitle: 'Sentry logs',
    iconName: 'sentry',
    eventType: EventTypes.Sentry
  },
  [PAGE_TYPES.Profiler]: {
    title: 'Profiler',
    sidebarTitle: 'Profiler',
    iconName: 'profiler',
    eventType: EventTypes.Profiler
  },
  [PAGE_TYPES.Smtp]: {
    title: 'SMTP',
    sidebarTitle: 'SMTP mails',
    iconName: 'smtp',
    eventType: EventTypes.Smtp
  },
  [PAGE_TYPES.HttpDump]: {
    title: 'Http Dump',
    sidebarTitle: 'Http dumps',
    iconName: 'http-dump',
    eventType: EventTypes.HttpDump
  },
  [PAGE_TYPES.Inspector]: {
    title: 'Inspector',
    sidebarTitle: 'Inspector logs',
    iconName: 'inspector',
    eventType: EventTypes.Inspector
  },
  [PAGE_TYPES.VarDump]: {
    title: 'Var Dump',
    sidebarTitle: 'Var dump logs',
    iconName: 'var-dump',
    eventType: EventTypes.VarDump
  },
  [PAGE_TYPES.Monolog]: {
    title: 'Monolog',
    sidebarTitle: 'Monolog logs',
    iconName: 'monolog',
    eventType: EventTypes.Monolog
  },
  [PAGE_TYPES.RayDump]: {
    title: 'Ray Dump',
    sidebarTitle: 'Ray dump logs',
    iconName: 'ray',
    eventType: EventTypes.RayDump
  }
}
