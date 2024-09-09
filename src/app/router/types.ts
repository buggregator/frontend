import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import {RouteAuthAccessError} from "@/shared/lib/errors";

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}) => Promise<RouteAuthAccessError | undefined>

