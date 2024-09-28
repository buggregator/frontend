export enum RayEventTypes {
  Log = 'log',
  // SIZE = "size",
  Custom = 'custom',
  // LABEL = "label",
  Caller = 'caller',
  Carbon = 'carbon',
  // COLOR = "color",
  Exception = 'exception',
  // HIDE = "hide",
  Measure = 'measure',
  Notify = 'notify',
  Mailable = 'mailable',
  Table = 'table',
  Trace = 'trace',
  Query = 'executed_query',
  ApplicationLog = 'application_log',
  Eloquent = 'eloquent_model',
  View = 'view',
  Event = 'event',
  Job = 'job_event',
  Lock = 'create_lock',
}

export interface RayFrame {
  file_name: string;
  line_number: number;
  class: string | null;
  method: string;
  vendor_frame: boolean;
  snippet?: { line_number: number; text: string }[];
}

export interface RayPayloadOrigin {
  file: string;
  line_number: number;
  hostname: string;
}

export interface RayContent {
  content: string;
  label: string;
}

export interface RayContentCarbon {
  formatted: string;
  timestamp: number;
  timezone: string;
}

export interface RayContentArray {
  values: string[] | number[] | boolean[];
}

export interface RayContentObject {
  values: Record<string, string>;
}

export interface RayContentException {
  class?: string;
  message?: string;
  frames: RayFrame[];
}

export interface RayContentSQL {
  sql: string;
  bindings?: string[];
  connection_name: string;
  time: number;
}

export interface RayContentEloquent {
  class_name: string;
  attributes: string;
}

export interface RayContentApplicationLog {
  value: string;
}

export interface RayContentView {
  view_path: string;
  view_path_relative_to_project_root: string;
  data: string;
}

export interface RayContentJob {
  event_name: string;
  job: string;
  exception: string | null;
}

export interface RayContentLabel {
  label: string;
  [key: string]: unknown;
}

export interface RayContentColor {
  color: string;
  [key: string]: unknown;
}

export interface RayContentSize {
  size: string;
  [key: string]: unknown;
}

export interface RayContentFrame {
  frame: RayFrame;
}

export interface RayContentFrames {
  frames: RayFrame[];
}

export interface RayContentMeasure {
  name: string;
  is_new_timer: boolean;
  total_time: number;
  max_memory_usage_during_total_time: number;
  time_since_last_call: number;
  max_memory_usage_since_last_call: number;
}

export interface RayUser {
  name: string;
  email: string;
}

export interface RayContentMail {
  subject: string;
  from: RayUser[];
  to: RayUser[];
  cc?: RayUser[];
  bcc?: RayUser[];
  reply_to?: RayUser[];
  mailable_class?: string;
  html: string;
}
export interface RayContentLog {
  values: string[] | number[];
}

export interface RayContentEvent {
  name: string;
  event: string;
  payload: unknown;
  class_based_event: boolean;
}

export interface RayContentLock {
  name: string;
}

export interface RayContentCustom {
  content?: string;
  label?: string;
}

export interface RayPayload {
  type: RayEventTypes | string;
  origin?: RayPayloadOrigin;
  content:
    | RayContentException
    | RayContent
    | RayContentArray
    | RayContentObject
    | RayContentCarbon
    | RayContentSQL
    | RayContentApplicationLog
    | RayContentEloquent
    | RayContentView
    | RayContentJob
    | RayContentFrame
    | RayContentFrames
    | RayContentMeasure
    | RayContentMail
    | RayContentLog
    | RayContentEvent
    | RayContentCustom
    | { value: string }
    | RayContentColor
    | RayContentLabel
    | RayContentLock
    | RayContentSize
    | unknown[];
}

export interface RayDump {
  uuid: string;
  payloads: RayPayload[];
  meta?: {
    php_version: string;
    php_version_id: number;
    project_name: string;
    ray_package_version: string;
    symfony_version?: string;
    laravel_version?: string;
  };
}

export interface RayDumpMeta {
  color: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}
