import { createRouter, createWebHistory } from 'vue-router'
import { RouteName } from './types'
import { HomePage } from "@/screens/home";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: RouteName.Home,
      component: HomePage
    },
  ]
})
