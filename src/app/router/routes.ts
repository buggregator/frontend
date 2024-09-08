import {RouteName} from "@/shared/types/app";
import {auth} from "./middlewares";
import {HomePage} from "@/screens/home";
import {SettingsPage} from "@/screens/settings";

export const routes = [
  {
    path: '/',
    name: RouteName.Home,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/http-dump',
    name: RouteName.HttpDump,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/inspector',
    name: RouteName.Inspector,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/monolog',
    name: RouteName.Monolog,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/profiler',
    name: RouteName.Profiler,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/ray',
    name: RouteName.RayDump,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/sentry',
    name: RouteName.Sentry,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/smtp',
    name: RouteName.Smtp,
    component: HomePage,
    meta: {
      middleware: [auth]
    }
  },
  {
    path: '/var-dump',
    name: RouteName.VarDump,
    component: HomePage,
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
