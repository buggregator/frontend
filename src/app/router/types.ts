import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export const CONTINUE = Symbol('continue')

export type TRouterMiddleware = (params: {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
  next: NavigationGuardNext
}) => Promise<void | typeof CONTINUE>


export enum RouteName {
  VarDump = "var-dump",
  Smtp = "smtp",
  Sentry = "sentry",
  Profiler = "profiler",
  Monolog = "monolog",
  Inspector = "inspector",
  HttpDump = "http-dump",
  RayDump = "ray",
  Login = 'login',
  Settings = 'settings',
  Home = 'home',
}
