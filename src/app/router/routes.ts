import {EventPage} from "@/pages/event-page";
import {EventsListPage} from "@/pages/events-list-page";
import {LoginPage} from "@/pages/login";
import {NotFoundPage} from "@/pages/not-found";
import {ProfilerComparePage} from "@/pages/profiler-compare";
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
