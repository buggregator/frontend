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
    path: '/settings',
    name: RouteName.Settings,
    component: SettingsPage,
    meta: {
      middleware: [auth]
    }
  },
]
