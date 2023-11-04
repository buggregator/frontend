import { Source } from "~/src/shared/types";

export type StatusCode = number; // TODO: update type

export interface Monolog {
  message: string,
  context: {
    source: Source
  } | Record<string, unknown> | unknown,
  level: StatusCode,
  level_name: string,
  channel: string,
  datetime: string,
  extra: object,
}

