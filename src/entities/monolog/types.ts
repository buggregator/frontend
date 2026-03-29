import type { Source } from "@/shared/types";

export type StatusCode = number; // TODO: update type

export enum MonologLevel {
  DEBUG = 100,
  INFO = 200,
  NOTICE = 250,
  WARNING = 300,
  ERROR = 400,
  CRITICAL = 500,
  ALERT = 550,
  EMERGENCY = 600,
}

export interface Monolog {
  message: string,
  context: {
    source?: Source,
    [key: string]: unknown
  },
  level: StatusCode,
  level_name: string,
  channel: string,
  datetime: string,
  extra: Record<string, unknown> | never[],
}

