import { NormalizedEvent, Source } from "~/src/shared/types";

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

export interface NormalizedMonolog extends Omit<NormalizedEvent<Monolog>, 'date'> {
  date: Date | null
}

