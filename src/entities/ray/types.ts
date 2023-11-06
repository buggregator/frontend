
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
