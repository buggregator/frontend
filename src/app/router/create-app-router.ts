import { createRouter, createWebHistory } from 'vue-router';
import { RouteAuthAccessError, RouteAvailabilityError } from '@/shared/lib/errors';
import { RouteName } from '@/shared/types';
import { routes } from './routes';
import type { TRouterMiddleware } from './types';

export const createAppRouter = () => {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.beforeEach(async (to, from, next) => {
    if (!to.meta.middleware) {
      return next();
    }

    const middlewares = (
      Array.isArray(to.meta.middleware)
        ? to.meta.middleware
        : [to.meta.middleware]) as TRouterMiddleware[];

    const context = {
      to,
      from,
      next,
    };

    for (let i = 0; i < middlewares.length; i += 1) {
      try {
        await middlewares[i]({ ...context });
      } catch (e) {
        if (e instanceof RouteAuthAccessError) {
          next({
            name: RouteName.Login,
          });
        }
        if (e instanceof RouteAvailabilityError) {
          next({
            name: RouteName.NotFound,
          });
        }

        return;
      }
    }

    return next();
  });

  return router;
};
