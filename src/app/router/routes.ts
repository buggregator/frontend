import {EventPage} from "@/pages/event-page";
import {EventsListPage} from "@/pages/events-list-page";
import {LoginPage} from "@/pages/login";
import {MetricsPage} from "@/pages/metrics";
import {NotFoundPage} from "@/pages/not-found";
import {ProfilerComparePage} from "@/pages/profiler-compare";
import {
  SentryLayoutPage,
  SentryExceptionsPage,
  SentryTracesPage,
  SentryLogsPage,
  SentryTraceDetailPage,
} from "@/pages/sentry";
import {SettingsPage} from "@/pages/settings";
import {RouteName} from "@/shared/types";
import {auth, checkType} from "./middlewares";

export const routes = [
  {
    path: '/',
    name: RouteName.Home,
    component: EventsListPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/metrics',
    name: RouteName.Metrics,
    component: MetricsPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/sentry/event/:id',
    name: RouteName.SentryExceptionDetail,
    component: EventPage,
    meta: {
      middleware: [auth]
    },
  },
  {
    path: '/sentry',
    component: SentryLayoutPage,
    meta: {
      middleware: [auth]
    },
    children: [
      { path: '', redirect: '/sentry/exceptions' },
      { path: 'exceptions', name: RouteName.SentryExceptions, component: SentryExceptionsPage },
      { path: 'traces', name: RouteName.SentryTraces, component: SentryTracesPage },
      { path: 'traces/:traceId', name: RouteName.SentryTraceDetail, component: SentryTraceDetailPage },
      { path: 'logs', name: RouteName.SentryLogs, component: SentryLogsPage },
      { path: ':id', redirect: to => `/sentry/event/${to.params.id}` },
    ]
  },
  {
    path: '/:type',
    name: RouteName.EventList,
    component: EventsListPage,
    meta: {
      middleware: [auth, checkType]
    }
  },
  {
    path: '/profiler/compare',
    name: RouteName.ProfilerCompare,
    component: ProfilerComparePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/:type/:id',
    name: RouteName.EventPage,
    component: EventPage,
    meta: {
      middleware: [auth, checkType]
    }
  },
  {
    path: '/favorites',
    name: RouteName.Favorites,
    component: EventsListPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/404',
    name: RouteName.NotFound,
    component: NotFoundPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/settings',
    name: RouteName.Settings,
    component: SettingsPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/login',
    name: RouteName.Login,
    component: LoginPage,
    meta: {
      middleware: [auth]
    }
  },
]
