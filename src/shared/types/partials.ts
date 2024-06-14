import type {Uuid} from "./events";

export interface Source {
  file: string,
  name: string,
  line: string,
  file_excerpt?: boolean
}

export interface Attachment {
  uuid: Uuid,
  name: string,
  size: number,
  mime: string,
  uri: string
}

export enum GraphTypes {
  CPU = 'cpu',
  WALL_TIME = 'wt',
  MEMORY_CHANGE = 'pmu',
  MEMORY = 'mu',
  CALLS = 'ct',
}

export enum TopFunctionsMetric {
  CPU = 'cpu',
  WALL_TIME = 'wt',
  MEMORY_CHANGE = 'pmu',
  MEMORY = 'mu',
  CALLS = 'ct',

  EXCLUSIVE_CPU = 'excl_cpu',
  EXCLUSIVE_WALL_TIME = 'excl_wt',
  EXCLUSIVE_MEMORY_CHANGE = 'excl_pmu',
  EXCLUSIVE_MEMORY = 'excl_mu',
  EXCLUSIVE_CALLS = 'excl_ct',
}
