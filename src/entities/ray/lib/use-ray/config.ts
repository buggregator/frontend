import { computed } from "vue";
import type { OneOfValues } from "~/src/shared/types";
import {
  RAY_EVENT_TYPES,
  type RayContentApplicationLog,
  type RayContentCarbon,
  type RayContentCustom,
  type RayContentEloquent,
  type RayContentEvent,
  type RayContentException,
  type RayContentFrame,
  type RayContentFrames,
  type RayContentJob,
  type RayContentLock,
  type RayContentLog,
  type RayContentMail,
  type RayContentMeasure,
  type RayContentObject,
  type RayContentSQL,
  type RayContentView,
  type RayPayload
} from "../../types";
import { RayApplicationLog } from "../../ui/ray-application-log";
import { RayCarbon } from "../../ui/ray-carbon";
import { RayCustom } from "../../ui/ray-custom";
import { RayEloquent } from "../../ui/ray-eloquent";
import { RayEvent } from "../../ui/ray-event";
import { RayException } from "../../ui/ray-exception";
import { RayFrame } from "../../ui/ray-frame";
import { RayJob } from "../../ui/ray-job";
import { RayLock } from "../../ui/ray-lock";
import { RayLog } from "../../ui/ray-log";
import { RayMail } from "../../ui/ray-mail";
import { RayMeasure } from "../../ui/ray-measure";
import { RayOrigin } from "../../ui/ray-origin";
import { RayQuery } from "../../ui/ray-query";
import { RayTable } from "../../ui/ray-table";
import { RayTrace } from "../../ui/ray-trace";
import { RayView } from "../../ui/ray-view";

export const COMPONENT_TYPE_MAP: Record<RAY_EVENT_TYPES, {
  view: unknown,
  getProps: (payload: RayPayload) => Record<string, unknown>
}> = {
  [RAY_EVENT_TYPES.LOG]: {
    view: RayLog,
    getProps: (payload: RayPayload) => ({
      log: (payload.content as RayContentLog).values[0],
    }),
  },
  [RAY_EVENT_TYPES.CUSTOM]: {
    view: RayCustom,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentCustom,
    }),
  },
  [RAY_EVENT_TYPES.CALLER]: {
    view: RayFrame,
    getProps: (payload: RayPayload) => ({
      frame: (payload.content as RayContentFrame).frame,
    }),
  },
  [RAY_EVENT_TYPES.CARBON]: {
    view: RayCarbon,
    getProps: (payload: RayPayload) => ({
      carbon: payload.content as RayContentCarbon,
    }),
  },
  [RAY_EVENT_TYPES.TRACE]: {
    view: RayTrace,
    getProps: (payload: RayPayload) => ({
      frames: (payload.content as RayContentFrames).frames,
    }),
  },
  [RAY_EVENT_TYPES.EXCEPTION]: {
    view: RayException,
    getProps: (payload: RayPayload) => ({
      exception: payload.content as RayContentException,
    }),
  },
  [RAY_EVENT_TYPES.TABLE]: {
    view: RayTable,
    getProps: (payload: RayPayload) => ({
      table: payload.content as RayContentObject,
    }),
  },
  [RAY_EVENT_TYPES.MEASURE]: {
    view: RayMeasure,
    getProps: (payload: RayPayload) => ({
      measure: payload.content as RayContentMeasure,
    }),
  },
  [RAY_EVENT_TYPES.QUERY]: {
    view: RayQuery,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentSQL,
    }),
  },
  [RAY_EVENT_TYPES.ELOQUENT]: {
    view: RayEloquent,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentEloquent,
    }),
  },
  [RAY_EVENT_TYPES.APPLICATION_LOG]: {
    view: RayApplicationLog,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentApplicationLog,
    }),
  },
  [RAY_EVENT_TYPES.VIEW]: {
    view: RayView,
    getProps: (payload: RayPayload) => ({
      view: payload.content as RayContentView,
    }),
  },
  [RAY_EVENT_TYPES.EVENT]: {
    view: RayEvent,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentEvent,
    }),
  },
  [RAY_EVENT_TYPES.JOB]: {
    view: RayJob,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentJob,
    }),
  },
  [RAY_EVENT_TYPES.LOCK]: {
    view: RayLock,
    getProps: (payload: RayPayload) => ({
      name: (payload.content as RayContentLock).name,
    }),
  },
  [RAY_EVENT_TYPES.MAILABLE]: {
    view: RayMail,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentMail,
    }),
  },
  [RAY_EVENT_TYPES.NOTIFY]: {
    view: RayOrigin,
    getProps: (payload: RayPayload) => ({ origin: payload.origin }),
  },
};
