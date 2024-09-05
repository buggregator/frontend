import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export const CONTINUE = Symbol('continue')

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}) => Promise<void | typeof CONTINUE>

