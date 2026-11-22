import { createRouter, createWebHistory } from 'vue-router'
import {RouteAuthAccessError, RouteAvailabilityError} from "@/shared/lib/errors";
import {RouteName} from "@/shared/types";
import { loginRoute } from './middlewares'
import { routes } from './routes'
import type { TRouterMiddleware } from './types'

export const createAppRouter = () => {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach(async (to, from, next) => {
    if (!to.meta.middleware) {
      return next()
    }

    const middlewares = (
      Array.isArray(to.meta.middleware) ? to.meta.middleware : [to.meta.middleware]
    ) as TRouterMiddleware[]

    const context = {
      to,
      from,
      next,
    }

    for (const middleware of middlewares) {
      try {
        const redirect = await middleware({...context})
        if (redirect) {
          return next(redirect)
        }
      } catch (e) {
        if (e instanceof RouteAuthAccessError) {
          next(loginRoute(to))
        }
        if (e instanceof RouteAvailabilityError) {
          next({
            name: RouteName.NotFound
          })
        }
        return
      }
    }

    return next()
  })

  return router
}
