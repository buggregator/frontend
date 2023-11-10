export interface SentryFrame {
  filename: string,
  lineno: number,
  in_app: boolean,
  abs_path?: string,
  pre_context?: string[],
  context_line?: string,
  post_context?: string[],
  function?: unknown,
}

export interface SentryException {
  type: string,
  value: string,
  stacktrace: {
    frames: SentryFrame[]
  },
  [key: string]: unknown
}

export interface SentryVersion {
  name: string,
  version: string,
  build?: string,
  kernel_version?: string,
}

export type SentryDevice = {
  screen_resolution: string,
  orientation: string,
  family: string,
  battery_level: number,
  screen_dpi: number,
  memory_size: number,
  timezone: string,
  external_storage_size: number,
  external_free_storage: number,
  screen_width_pixels: number,
  low_memory: boolean,
  simulator: boolean,
  screen_height_pixels: number,
  free_memory: number,
  online: boolean,
  screen_density: number,
  type: string,
  charging: boolean,
  model_id: string,
  brand: string,
  storage_size: number,
  boot_time: string,
  arch: string,
  manufacturer: string,
  name: string, // redacted
  free_storage: number,
  model: string,
  language?: unknown,
  id?: unknown,
  battery_temperature?: unknown,
  locale?: unknown,
}

export type SentryBreadcrumb = {
  type: string,
  category: string,
  level: string,
  timestamp: number,
  message: string,
  data?: unknown,
}

export type SentryApp = {
  device_app_hash: string,
  build_type: string,
  app_identifier: string,
  app_name: string,
  app_version: string,
  app_build: string,
  app_id: string,
  type: string,
  permissions?: unknown,
}

export type SentryRequest = {
  url: string,
  method?: string,
  headers: object,
  data?: object,
}

// TODO: Cover all possible cases
// https://github.com/getsentry/sentry/tree/master/static/app/components/events/contexts
export interface Sentry {
  event_id: string,
  timestamp: number,
  platform: string,
  message?: string,
  contexts: {
    runtime?: SentryVersion | unknown,
    os?: SentryVersion | unknown,
    app?: SentryApp | unknown,
    device?: SentryDevice | unknown,
    trace?: Record<string, unknown>,
  },
  breadcrumbs?: {
    values: SentryBreadcrumb[]
  },
  sdk: SentryVersion,
  logger?: string,
  transaction?: string,
  server_name?: string,
  environment: string,
  modules?: object,
  extra?: unknown,
  tags?: object,
  request?: SentryRequest,
  exception?: {
    values: SentryException[]
  }
}
