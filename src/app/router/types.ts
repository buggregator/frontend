import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized;
  from: RouteLocationNormalized;
  next: NavigationGuardNext;
}) => Promise<undefined>;
