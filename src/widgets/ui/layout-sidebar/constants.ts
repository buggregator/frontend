import {PAGE_TYPES} from "~/src/shared/constants";
import {EVENT_TYPES} from "~/src/shared/types";

export const EVENTS_NAV_ORDER: EVENT_TYPES[] = [
  PAGE_TYPES.SENTRY,
  PAGE_TYPES.PROFILER,
  PAGE_TYPES.SMTP,
  PAGE_TYPES.HTTP_DUMP,
  PAGE_TYPES.INSPECTOR,
  PAGE_TYPES.VAR_DUMP,
  PAGE_TYPES.MONOLOG,
  PAGE_TYPES.RAY_DUMP,
]

export const EVENTS_LINKS_MAP: { [key in EVENT_TYPES ]: { title: string, iconName: string, path: `/${string}`, eventType: EVENT_TYPES }} = {
  [PAGE_TYPES.SENTRY]: {
    title: 'Sentry logs',
    iconName: 'sentry',
    path: '/sentry',
    eventType: EVENT_TYPES.SENTRY,
  },
  [PAGE_TYPES.PROFILER]: {
    title: 'Profiler',
    iconName: 'profiler',
    path: '/profiler',
    eventType: EVENT_TYPES.PROFILER,
  },
  [PAGE_TYPES.SMTP]: {
    title: 'SMTP mails',
    iconName: 'smtp',
    path: '/smtp',
    eventType: EVENT_TYPES.SMTP,
  },
  [PAGE_TYPES.HTTP_DUMP]: {
    title: 'Http dumps',
    iconName: 'http-dump',
    path: '/http-dump',
    eventType: EVENT_TYPES.HTTP_DUMP,
  },
  [PAGE_TYPES.INSPECTOR]: {
    title: 'Inspector logs',
    iconName: 'inspector',
    path: '/inspector',
    eventType: EVENT_TYPES.INSPECTOR,
  },
  [PAGE_TYPES.VAR_DUMP]: {
    title: 'Var dump logs',
    iconName: 'var-dump',
    path: '/var-dump',
    eventType: EVENT_TYPES.VAR_DUMP,
  },
  [PAGE_TYPES.MONOLOG]: {
    title: 'Monolog logs',
    iconName: 'monolog',
    path: '/monolog',
    eventType: EVENT_TYPES.MONOLOG,
  },
  [PAGE_TYPES.RAY_DUMP]: {
    title: 'Ray dump logs',
    iconName: 'ray',
    path: '/ray',
  eventType: EVENT_TYPES.RAY_DUMP,
  }
}
