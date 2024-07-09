import * as SentryTypes from '@sentry/types'

export type SentryFrame = SentryTypes.StackFrame

export type SentryException = Omit<SentryTypes.Exception, 'mechanism'> & {
  mechanism?: Omit<SentryTypes.Mechanism, 'data'> & {
    data?: {
      [key: string]: string | boolean | number
    }
  }
}
export type SentryContextRuntime = SentryTypes.Runtime

export type SentryContextOS = SentryTypes.OsContext
export type SentryContextApp = SentryTypes.AppContext

export type SentryDevice = Omit<SentryTypes.DeviceContext, 'orientation'> & {
  orientation?: SentryTypes.DeviceContext['orientation'] | string
  language?: string
  id?: string
  timezone?: string
  battery_temperature?: string
  locale?: string
}

type SentryLevel = SentryTypes.Breadcrumb['level'] | string

export type SentryBreadcrumb = Omit<SentryTypes.Breadcrumb, 'level'> & {
  level?: SentryLevel
}

export type SentryRequest = Omit<SentryTypes.Request, 'headers'> & {
  headers?: {
    [key: string]: string | string[];
  }
}

export type SentryContexts = Omit<SentryTypes.Contexts, 'device' | 'app'> & {
  runtime?: SentryTypes.Runtime;
  device?: SentryDevice;
  app?: unknown;
}

export interface Sentry extends Omit<SentryTypes.Event, 'request' | 'exception' | 'breadcrumbs' | 'level' | 'contexts'> {
  platform?: string,
  contexts?: SentryContexts,
  request?: SentryRequest,
  exception?: {
    values: SentryException[]
  },
  breadcrumbs?: {
    values: SentryBreadcrumb[]
  },
  level?: SentryLevel,
  modules?: {
    [key: string]: string
  },
  extra?: {
    environment?: Record<string, string>,
  }
}
