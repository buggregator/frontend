import type {RayDump, RayDumpMeta} from "@/entities/ray/types";
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
}

// TODO: add T prefix to all types

export type EventId = string;
export type Uuid = string;

export type EventType = OneOfValues<typeof EventTypes>;

export interface ServerEvent<T> {
  uuid: EventId,
  type: EventType | unknown,
  payload: T,
  project: string | null,
  timestamp: number // unavailable for some ray dump events
}

export interface NormalizedEvent<T> {
  id: EventId,
  type: EventType | 'unknown',
  labels: (string | { title: string, value: string, context: string })[],
  origin: object | null,
  serverName: string,
  date: Date | null,
  payload: T
  meta?: T extends RayDump ? RayDumpMeta: never
}

export interface MappedEventsProps<T> {
  view: unknown;
  normalize: (event: ServerEvent<T>) => NormalizedEvent<T>
}

export type EventTypeCount = {
  type: EventType;
  count: number;
}

export type EventsPreviewMeta = {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
  grid: unknown[];
}
