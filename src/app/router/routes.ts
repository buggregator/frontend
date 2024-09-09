import {RouteName} from "@/shared/types/app";
import {auth} from "./middlewares";
import {EventPage} from "@/screens/event-page";
import {EventsListPage} from "@/screens/events-list-page";
import {SettingsPage} from "@/screens/settings";

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
      middleware: [auth]
    }
  },
  {
    path: '/:type/:id',
    name: RouteName.EventPage,
    component: EventPage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/404',
    name: RouteName.NotFound,
    component: EventPage,
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
]
