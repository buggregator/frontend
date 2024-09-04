import { createRouter, createWebHistory } from 'vue-router'
import { MonologPage } from '@/screens/monolog'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Monolog',
      component: MonologPage
    },
  ]
})
