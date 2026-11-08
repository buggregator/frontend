import type { OneOfValues } from "./generics";

export enum EventTypes {
  VarDump = "var-dump",
  Smtp = "smtp",
  Sentry = "sentry",
  Profiler = "profiler",
  Monolog = "monolog",
  Inspector = "inspector",
  HttpDump = "http-dump",
  RayDump = "ray",
  Sms = "sms",
  SentryTrace = "sentry-trace",
  SentryLog = "sentry-log",
  XdebugTrace = "xdebug-trace",
}

// TODO: add T prefix to all types

export type EventId = string;
export type Uuid = string;

export type EventType = OneOfValues<typeof EventTypes>;

const EVENT_TYPES = new Set<string>(Object.values(EventTypes));

// The server can send a type this UI does not know yet (a newer module).
export const isEventType = (value: unknown): value is EventType =>
  typeof value === 'string' && EVENT_TYPES.has(value);

export type LabelColor = 'gray' | 'blue' | 'cyan' | 'amber' | 'red' | 'orange' | 'green' | 'violet';

export interface ServerEvent<T> {
  uuid: EventId,
  // A known EventType, or any other string the server sent: check with isEventType.
  // `string & {}` keeps the known names in autocomplete.
  type: EventType | (string & {}),
  payload: T,
  project: string | null,
  timestamp: number, // unavailable for some ray dump events
  searchable_text?: string,
  is_pinned?: boolean,
}

// M: extra data one event type adds to its cards (Ray: color and size).
export interface NormalizedEvent<T, M = unknown> {
  id: EventId,
  type: EventType | 'unknown',
  labels: (string | { title: string, value: string, context: string } | { text: string, color: LabelColor })[],
  origin: object | null,
  serverName: string,
  date: Date | null,
  payload: T
  meta?: M
}

export interface MappedEventsProps<T> {
  view: unknown;
  normalize: (event: ServerEvent<T>) => NormalizedEvent<T>
}
