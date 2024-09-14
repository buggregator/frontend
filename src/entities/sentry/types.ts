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

export type SentryDevice = Omit<SentryTypes.DeviceContext, 'orientation'> & {
  timezone?: string;
  type?: string;
  name?: string;
  orientation?: string;
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

export type SentryContextApp = SentryTypes.AppContext & {
  app_id?: string;
  device_app_hash?: string,
  type?: string,
  permissions?: string[];
}

export type SentryContexts = Omit<SentryTypes.Contexts, 'device' | 'app'> & {
  device?: SentryDevice;
  app?: SentryContextApp;
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
  }
}
