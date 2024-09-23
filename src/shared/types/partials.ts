import type { Uuid } from './events';

export interface Source {
  file: string;
  name: string;
  line: string;
  file_excerpt?: boolean;
}

export interface Attachment {
  uuid: Uuid;
  name: string;
  size: number;
  mime: string;
  path: string;
}

export enum GraphTypes {
  CPU = 'cpu',
  WALL_TIME = 'wt',
  MEMORY_CHANGE = 'pmu',
  MEMORY = 'mu',
  CALLS = 'ct',
}

export type StatsBase = {
  ct: number;
  cpu: number;
  wt: number;
  mu: number;
  pmu: number;
};
