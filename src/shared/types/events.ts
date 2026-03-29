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
  Sms = "sms",
}

// TODO: add T prefix to all types

export type EventId = string;
export type Uuid = string;

export type EventType = OneOfValues<typeof EventTypes>;

export type LabelColor = 'gray' | 'blue' | 'cyan' | 'amber' | 'red' | 'orange' | 'green' | 'violet';

export interface ServerEvent<T> {
  uuid: EventId,
  type: EventType | unknown,
  payload: T,
  project: string | null,
  timestamp: number, // unavailable for some ray dump events
  searchable_text?: string,
  is_pinned?: boolean,
}

export interface NormalizedEvent<T> {
  id: EventId,
  type: EventType | 'unknown',
  labels: (string | { title: string, value: string, context: string } | { text: string, color: LabelColor })[],
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
