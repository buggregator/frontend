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
  orientation: SentryTypes.DeviceContext['orientation'] | string
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

export interface Sentry extends Omit<SentryTypes.Event, 'request' | 'exception' | 'breadcrumbs' | 'level'> {
  contexts?: Omit<SentryTypes.Contexts, 'device'> & {
    runtime?: SentryTypes.Runtime;
    device?: SentryDevice
  },
  request?: SentryRequest,
  exception?: {
    values: SentryException[]
  },
  breadcrumbs?: {
    values: SentryBreadcrumb[]
  },
  level?: SentryLevel
}
