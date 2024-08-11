export interface InspectorTransaction {
  model: 'transaction' | string,
  name?: string,
  type: string,
  hash?: string,
  host: {
    hostname: string,
    ip: string
    os: string,
  },
  http?: {
    request: {
      method: string,
      version: string,
      socket: {
        remote_address: string,
        [key: string]: string
      },
      cookies: {
        [key: string]: string
      },
      headers: {
        [key: string]: string
      }
    },
    url: {
      protocol: string,
      port: number | string,
      path: string,
      search: string,
      full: string,
    },
  },
  result?: string,
  timestamp: number,
  memory_peak?: number,
  duration: number,
}

export interface InspectorSegment {
  model: 'segment',
  type: string,
  label?: string,
  host: {
    hostname: string,
    ip: string
    os: string,
  },
  transaction?: {
    name: string,
    timestamp: number,
    hash: string,
  },
  start?: number,
  timestamp: number,
  context: object
  duration: number,
  name?: string,
}

export type Inspector = InspectorTransaction[] | InspectorSegment[];

