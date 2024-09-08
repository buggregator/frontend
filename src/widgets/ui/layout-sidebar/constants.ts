import {PAGE_TYPES} from "@/shared/constants";
import {EVENT_TYPES, EventTypes} from "@/shared/types";

export const EVENTS_NAV_ORDER: EventTypes[] = [
  EventTypes.Sentry,
  EventTypes.Profiler,
  EventTypes.Smtp,
  EventTypes.HttpDump,
  EventTypes.Inspector,
  EventTypes.VarDump,
  EventTypes.Monolog,
  EventTypes.RayDump,
]

export const EVENTS_LINKS_MAP: { [key in EVENT_TYPES ]: { title: string, iconName: string, path: `/${string}`, eventType: EVENT_TYPES }} = {
  [PAGE_TYPES.Sentry]: {
    title: 'Sentry logs',
    iconName: 'sentry',
    path: '/sentry',
    eventType: EVENT_TYPES.SENTRY,
  },
  [PAGE_TYPES.Profiler]: {
    title: 'Profiler',
    iconName: 'profiler',
    path: '/profiler',
    eventType: EVENT_TYPES.PROFILER,
  },
  [PAGE_TYPES.Smtp]: {
    title: 'SMTP mails',
    iconName: 'smtp',
    path: '/smtp',
    eventType: EVENT_TYPES.SMTP,
  },
  [PAGE_TYPES.HttpDump]: {
    title: 'Http dumps',
    iconName: 'http-dump',
    path: '/http-dump',
    eventType: EVENT_TYPES.HTTP_DUMP,
  },
  [PAGE_TYPES.Inspector]: {
    title: 'Inspector logs',
    iconName: 'inspector',
    path: '/inspector',
    eventType: EVENT_TYPES.INSPECTOR,
  },
  [PAGE_TYPES.VarDump]: {
    title: 'Var dump logs',
    iconName: 'var-dump',
    path: '/var-dump',
    eventType: EVENT_TYPES.VAR_DUMP,
  },
  [PAGE_TYPES.Monolog]: {
    title: 'Monolog logs',
    iconName: 'monolog',
    path: '/monolog',
    eventType: EVENT_TYPES.MONOLOG,
  },
  [PAGE_TYPES.RayDump]: {
    title: 'Ray dump logs',
    iconName: 'ray',
    path: '/ray',
  eventType: EVENT_TYPES.RAY_DUMP,
  }
}
