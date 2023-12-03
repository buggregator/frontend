<script lang="ts" setup>
import { computed } from "vue";
import type { NormalizedEvent } from "~/src/shared/types";
import { PreviewCard } from "~/src/shared/ui";
import type {
  EnhancedRayEvent,
  RayContentCarbone,
  RayContentCustom,
  RayContentEloquent,
  RayContentApplicationLog,
  RayContentEvent,
  RayContentException,
  RayContentFrame,
  RayContentFrames,
  RayContentJob,
  RayContentLock,
  RayContentLog,
  RayContentMail,
  RayContentMeasure,
  RayContentObject,
  RayContentSQL,
  RayContentView,
  RayDump,
  RayPayload,
} from "../../types";
import { RAY_EVENT_TYPES } from "../../types";
import { RayApplicationLog } from "../ray-application-log";
import { RayCarbone } from "../ray-carbone";
import { RayCustom } from "../ray-custom";
import { RayEloquent } from "../ray-eloquent";
import { RayEvent } from "../ray-event";
import { RayException } from "../ray-exception";
import { RayFrame } from "../ray-frame";
import { RayJob } from "../ray-job";
import { RayLock } from "../ray-lock";
import { RayLog } from "../ray-log";
import { RayMail } from "../ray-mail";
import { RayMeasure } from "../ray-measure";
import { RayOrigin } from "../ray-origin";
import { RayQuery } from "../ray-query";
import { RayTable } from "../ray-table";
import { RayTrace } from "../ray-trace";
import { RayView } from "../ray-view";

type Props = {
  event: EnhancedRayEvent;
};

const props = defineProps<Props>();

const normalizedEvent = computed(() => {
  const { meta, ...rest } = props.event;

  return rest as NormalizedEvent<RayDump>;
});

const classes = computed(() => [
  `text-${props.event.meta.size}`,
  `text-${props.event.meta.color}-900 dark:text-${props.event.meta.color}-200`,
]);

const COMPONENT_TYPE_MAP = {
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
    view: RayCarbone,
    getProps: (payload: RayPayload) => ({
      carbone: payload.content as RayContentCarbone,
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
</script>

<template>
  <PreviewCard class="ray-dump-preview" :event="normalizedEvent">
    <template
      v-for="payload in event.payload.payloads"
      :key="`${payload.type}-${
        payload.origin ? payload.origin.line_number : ''
      }`"
    >
      <Component
        :is="COMPONENT_TYPE_MAP[payload.type].view"
        v-if="payload.type && COMPONENT_TYPE_MAP[payload.type]"
        v-bind="{ ...COMPONENT_TYPE_MAP[payload.type].getProps(payload) }"
        :class="classes"
      />
    </template>
  </PreviewCard>
</template>
