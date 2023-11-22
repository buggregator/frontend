export interface Source {
  file: string,
  name: string,
  line: string,
  file_excerpt?: boolean
}

export interface Attachment {
  id: string,
  name: string,
  size: number,
  mime: string,
  uri: string
}

export enum GraphTypes {
  CPU = 'cpu' ,
  MEMORY_CHANGE = 'pmu',
  MEMORY = 'mu',
  CALLS = 'calls',
}
