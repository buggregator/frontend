import type { Source } from '@/shared/types';

// TODO: update type
export type StatusCode = number;

export interface Monolog {
  message: string;
  context: {
    source?: Source;
    [key: string]: unknown;
  };
  level: StatusCode;
  level_name: string;
  channel: string;
  datetime: string;
  extra: Record<string, unknown> | never[];
}
