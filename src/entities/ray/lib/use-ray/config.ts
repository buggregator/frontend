import {
  RayEventTypes,
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

export const COMPONENT_TYPE_MAP: Record<
  RayEventTypes,
  {
    view: unknown;
    getProps: (payload: RayPayload) => Record<string, unknown>;
  }
> = {
  [RayEventTypes.Log]: {
    view: RayLog,
    getProps: (payload: RayPayload) => ({
      log: (payload.content as RayContentLog).values[0]
    })
  },
  [RayEventTypes.Custom]: {
    view: RayCustom,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentCustom
    })
  },
  [RayEventTypes.Caller]: {
    view: RayFrame,
    getProps: (payload: RayPayload) => ({
      frame: (payload.content as RayContentFrame).frame
    })
  },
  [RayEventTypes.Carbon]: {
    view: RayCarbon,
    getProps: (payload: RayPayload) => ({
      carbon: payload.content as RayContentCarbon
    })
  },
  [RayEventTypes.Trace]: {
    view: RayTrace,
    getProps: (payload: RayPayload) => ({
      frames: (payload.content as RayContentFrames).frames
    })
  },
  [RayEventTypes.Exception]: {
    view: RayException,
    getProps: (payload: RayPayload) => ({
      exception: payload.content as RayContentException
    })
  },
  [RayEventTypes.Table]: {
    view: RayTable,
    getProps: (payload: RayPayload) => ({
      table: payload.content as RayContentObject
    })
  },
  [RayEventTypes.Measure]: {
    view: RayMeasure,
    getProps: (payload: RayPayload) => ({
      measure: payload.content as RayContentMeasure
    })
  },
  [RayEventTypes.Query]: {
    view: RayQuery,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentSQL
    })
  },
  [RayEventTypes.Eloquent]: {
    view: RayEloquent,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentEloquent
    })
  },
  [RayEventTypes.ApplicationLog]: {
    view: RayApplicationLog,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentApplicationLog
    })
  },
  [RayEventTypes.View]: {
    view: RayView,
    getProps: (payload: RayPayload) => ({
      view: payload.content as RayContentView
    })
  },
  [RayEventTypes.Event]: {
    view: RayEvent,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentEvent
    })
  },
  [RayEventTypes.Job]: {
    view: RayJob,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentJob
    })
  },
  [RayEventTypes.Lock]: {
    view: RayLock,
    getProps: (payload: RayPayload) => ({
      name: (payload.content as RayContentLock).name
    })
  },
  [RayEventTypes.Mailable]: {
    view: RayMail,
    getProps: (payload: RayPayload) => ({
      content: payload.content as RayContentMail
    })
  },
  [RayEventTypes.Notify]: {
    view: RayOrigin,
    getProps: (payload: RayPayload) => ({ origin: payload.origin })
  }
};
