import type { RouteLocation } from 'vue-router'
import {EventsListPage} from "@/pages/events-list-page";
import {RouteName} from "@/shared/types";
import {auth, checkType} from "./middlewares";

// The feed is the first screen, so it stays in the main chunk. Every other
// page loads on first visit: Sentry, the profiler and vue-flow are not needed
// to show the feed.
const EventPage = () => import('@/pages/event-page').then((m) => m.EventPage)
const LoginPage = () => import('@/pages/login').then((m) => m.LoginPage)
const MetricsPage = () => import('@/pages/metrics').then((m) => m.MetricsPage)
const MockServerPage = () => import('@/pages/mock-server').then((m) => m.MockServerPage)
const NotFoundPage = () => import('@/pages/not-found').then((m) => m.NotFoundPage)
const ProfilerComparePage = () =>
  import('@/pages/profiler-compare').then((m) => m.ProfilerComparePage)
const SettingsPage = () => import('@/pages/settings').then((m) => m.SettingsPage)
const XdebugPage = () => import('@/pages/xdebug').then((m) => m.XdebugPage)
const sentryPages = () => import('@/pages/sentry')
const SentryLayoutPage = () => sentryPages().then((m) => m.SentryLayoutPage)
const SentryExceptionsPage = () => sentryPages().then((m) => m.SentryExceptionsPage)
const SentryTracesPage = () => sentryPages().then((m) => m.SentryTracesPage)
const SentryTraceDetailPage = () => sentryPages().then((m) => m.SentryTraceDetailPage)
const SentryLogsPage = () => sentryPages().then((m) => m.SentryLogsPage)
const SentryMetricsPage = () => sentryPages().then((m) => m.SentryMetricsPage)

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
      { path: 'metrics', name: RouteName.SentryMetrics, component: SentryMetricsPage },
      { path: ':id', redirect: (to: RouteLocation) => `/sentry/event/${to.params.id}` },
    ]
  },
  {
    path: '/mock-server',
    name: RouteName.MockServer,
    component: MockServerPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/xdebug',
    name: RouteName.Xdebug,
    component: XdebugPage,
    meta: {
      middleware: [auth]
    }
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
