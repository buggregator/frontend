import type { OneOfValues } from "./generics";

// TODO: add T prefix to all types

export enum EVENT_TYPES {
  VAR_DUMP = "var-dump",
  SMTP = "smtp",
  SENTRY = "sentry",
  PROFILER = "profiler",
  MONOLOG = "monolog",
  INSPECTOR = "inspector",
  HTTP_DUMP = "http-dump",
  RAY_DUMP = "ray",
}

export type EventId = string;
export type Uuid = string;

export type EventType = OneOfValues<typeof EVENT_TYPES>;

export type TEventLabel = (string | { title: string, value: string, context: string })[]

export interface ServerEvent<T> {
  uuid: EventId,
  type: EventType | string,
  payload: T,
  server_name?: string,
  project_id: string | null,
  timestamp?: number // unavailable for some ray dump events
}

export interface NormalizedEvent<T> {
  id: EventId,
  type: EventType | 'unknown',
  labels: (string | { title: string, value: string, context: string })[],
  origin: object | null,
  serverName: string,
  date: Date | null,
  payload: T
}
