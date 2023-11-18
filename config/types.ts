import { EventId, EventType } from "~/src/shared/types";

export type StatusCode = number; // TODO: update type
export type Email = string; // TODO: update type

type SMTPUser = {
  name: string;
  email: Email;
}

export interface Monolog {
  message: string,
  context: object,
  level: StatusCode,
  level_name: string,
  channel: string,
  datetime: string,
  extra: object,
}

export interface SMTP {
  id: string,
  from: SMTPUser[],
  reply_to: SMTPUser[],
  subject: string,
  to: SMTPUser[],
  cc: SMTPUser[],
  bcc: SMTPUser[],
  text: string,
  html: string,
  raw: string,
  attachments: unknown[]
}

export interface VarDump {
  payload: {
    type: string,
    value: string | number | boolean
  },
  context: {
    timestamp: number,
    cli: {
      command_line: string,
      identifier: string
    },
    source: {
      name: string,
      file: string,
      line: number,
      file_excerpt: boolean
    }
  }
}

interface RayContentFrame {
  file_name: string,
  line_number: number,
  class: string | null,
  method: string,
  vendor_frame: boolean,
  snippet?: { line_number: number, text: string }[]
}
export interface RayContent {
  content: string,
  label: string,
}

export interface RayContentCarbone {
  formatted: string,
  timestamp: number,
  timezone: string
}

export interface RayContentArray {
  values: string[] | number[] | boolean[]
}

export interface RayContentException {
  class?: string,
  message?: string,
  frames: RayContentFrame[]
}
export interface RayContentSQL {
  sql: string,
  bindings: string[],
  connection_name: string
  time: number
}
export interface RayContentEloquent {
  class_name: string,
  attributes: string
}
export interface RayContentViews {
  view_path: string,
  view_path_relative_to_project_root: string,
  data: string
}
export interface RayContentJobs {
  event_name: string,
  job: string,
  exception: string | null
}


export interface RayPayload {
  type: string,
  origin?: {
    file: string,
    line_number: number,
    hostname: string,
  },
  content: RayContentException
    | RayContentArray
    | RayContent
    | RayContentCarbone
    | RayContentSQL
    | RayContentEloquent
    | RayContentViews
    | RayContentJobs
    | { frame: RayContentFrame }
    | { value: string }
    | { color: string }
    | { label: string }
    | { name: string }
    | { size: string }
    | never[]
}

export interface RayDump {
  uuid: string,
  payloads: RayPayload[],
  meta?: {
    php_version: string,
    php_version_id: number,
    project_name: string,
    laravel_version: string,
    laravel_ray_package_version: string,
    ray_package_version: string,
  }
}

export interface InspectorTransaction {
  model: string,
  name: string,
  type: string,
  hash: string,
  host: {
    hostname: string,
    ip: string
    os: string,
  },
  http: {
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
  result: string,
  timestamp: number,
  memory_peak: number,
  duration: number,
}

export interface InspectorSegment {
  model: string,
  type: string,
  label: string,
  host: {
    hostname: string,
    ip: string
    os: string,
  },
  transaction: {
    name: string,
    timestamp: number,
  },
  start: number,
  timestamp: number,
  context: object
  duration: number,
}

export type Inspector = InspectorTransaction[] | InspectorSegment[];

export interface NormalizedEvent {
  id: EventId,
  type: EventType | string,
  labels: string[],
  origin: object | null,
  serverName: string,
  date: Date | null,
  color?: string,
  payload: Monolog | SMTP | VarDump | Inspector | RayDump | unknown
}

