import type { Source } from "~/src/shared/types";

export type StatusCode = number; // TODO: update type

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

