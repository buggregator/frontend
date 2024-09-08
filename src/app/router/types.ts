import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import {RouteAccessError} from "@/shared/lib/errors";

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}) => Promise<RouteAccessError | undefined>

