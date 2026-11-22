import type { NavigationGuardNext, RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
// A returned location ends the chain there: the navigation goes to it.
}) => Promise<void | RouteLocationRaw>

