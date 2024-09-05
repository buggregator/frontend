import { createRouter, createWebHistory } from 'vue-router'
import { RouteName } from '@/shared/types/app'
import {HomePage} from "@/screens/home";
import { SettingsPage} from "@/screens/settings";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: RouteName.Home,
      component: HomePage
    },
    {
      path: '/settings',
      name: RouteName.Settings,
      component: SettingsPage
    },
  ]
})
