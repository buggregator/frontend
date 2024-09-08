import {RouteName} from "../types/app";
import { EventTypes, } from "../types/events";
import { type PageEventTypes } from "../types/pages";

export const ALL_EVENT_TYPES = 'all-events' as const

// TODO convert it to enum
export const PAGE_TYPES = {
  ...EventTypes,
  ALL_EVENT_TYPES,
}

export const PAGES_SETTINGS: { [key in PageEventTypes ]: { title: string, sidebarTitle: string, iconName: string, routeName: RouteName, eventType: EventTypes | typeof ALL_EVENT_TYPES }} = {
  [ALL_EVENT_TYPES]: {
    title: 'Home',
    sidebarTitle: 'Home',
    iconName: 'home',
    routeName: RouteName.Home,
    eventType: ALL_EVENT_TYPES,
  },
  [EventTypes.Sentry]: {
    title: 'Sentry',
    sidebarTitle: 'Sentry logs',
    iconName: 'sentry',
    routeName: RouteName.Sentry,
    eventType: EventTypes.Sentry,
  },
  [EventTypes.Profiler]: {
    title: 'Profiler',
    sidebarTitle: 'Profiler',
    iconName: 'profiler',
    routeName: RouteName.Profiler,
    eventType: EventTypes.Profiler,
  },
  [EventTypes.Smtp]: {
    title: 'SMTP',
    sidebarTitle: 'SMTP mails',
    iconName: 'smtp',
    routeName: RouteName.Smtp,
    eventType: EventTypes.Smtp,
  },
  [EventTypes.HttpDump]: {
    title: 'Http dumps',
    sidebarTitle: 'Http dumps',
    iconName: 'http-dump',
    routeName: RouteName.HttpDump,
    eventType: EventTypes.HttpDump,
  },
  [EventTypes.Inspector]: {
    title: 'Inspector',
    sidebarTitle: 'Inspector logs',
    iconName: 'inspector',
    routeName: RouteName.Inspector,
    eventType: EventTypes.Inspector,
  },
  [EventTypes.VarDump]: {
    title: 'Var dump',
    sidebarTitle: 'Var dump logs',
    iconName: 'var-dump',
    routeName: RouteName.VarDump,
    eventType: EventTypes.VarDump,
  },
  [EventTypes.Monolog]: {
    title: 'Monolog',
    sidebarTitle: 'Monolog logs',
    iconName: 'monolog',
    routeName: RouteName.Monolog,
    eventType: EventTypes.Monolog,
  },
  [EventTypes.RayDump]: {
    title: 'Ray dump',
    sidebarTitle: 'Ray dump logs',
    iconName: 'ray',
    routeName: RouteName.RayDump,
    eventType: EventTypes.RayDump,
  }
}
