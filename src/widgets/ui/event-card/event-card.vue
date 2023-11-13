<script lang="ts" setup generic="T">
import { defineProps } from "vue";
import PreviewFallback from "~/components/PreviewFallback/PreviewFallback.vue";
import RayDumpPreview from "~/components/RayDumpPreview/RayDumpPreview.vue";
import {
  normalizeFallbackEvent,
  normalizeRayDumpEvent,
} from "~/utils/normalize-event";
import {
  useHttpDump,
  PreviewCard as PreviewHttpDump,
} from "~/src/entities/http-dump";
import {
  useInspector,
  PreviewCard as PreviewInspector,
} from "~/src/entities/inspector";
import {
  useMonolog,
  PreviewCard as PreviewMonolog,
} from "~/src/entities/monolog";
import {
  useProfiler,
  PreviewCard as PreviewProfiler,
} from "~/src/entities/profiler";
import { useSentry, PreviewCard as PreviewSentry } from "~/src/entities/sentry";
import { useSmtp, PreviewCard as PreviewSMTP } from "~/src/entities/smtp";
import {
  useVarDump,
  PreviewCard as PreviewVarDump,
} from "~/src/entities/var-dump";
import {
  EVENT_TYPES,
  ServerEvent,
  NormalizedEvent,
  EventType,
} from "~/src/shared/types";

const { normalizeProfilerEvent } = useProfiler();
const { normalizeVarDumpEvent } = useVarDump();
const { normalizeMonologEvent } = useMonolog();
const { normalizeSentryEvent } = useSentry();
const { normalizeSmtpEvent } = useSmtp();
const { normalizeInspectorEvent } = useInspector();
const { normalizeHttpDumpEvent } = useHttpDump();

type Props = {
  event: ServerEvent<T>;
};

const props = defineProps<Props>();

const EVENT_TYPE_COMPONENTS_MAP = {
  [EVENT_TYPES.SENTRY]: {
    view: PreviewSentry,
    normalize: normalizeSentryEvent,
  },
  [EVENT_TYPES.MONOLOG]: {
    view: PreviewMonolog,
    normalize: normalizeMonologEvent,
  },
  [EVENT_TYPES.VAR_DUMP]: {
    view: PreviewVarDump,
    normalize: normalizeVarDumpEvent,
  },
  [EVENT_TYPES.RAY_DUMP]: {
    view: RayDumpPreview,
    normalize: normalizeRayDumpEvent,
  },
  [EVENT_TYPES.SMTP]: {
    view: PreviewSMTP,
    normalize: normalizeSmtpEvent,
  },
  [EVENT_TYPES.PROFILER]: {
    view: PreviewProfiler,
    normalize: normalizeProfilerEvent,
  },
  [EVENT_TYPES.INSPECTOR]: {
    view: PreviewInspector,
    normalize: normalizeInspectorEvent,
  },
  [EVENT_TYPES.HTTP_DUMP]: {
    view: PreviewHttpDump,
    normalize: normalizeHttpDumpEvent,
  },
  unknown: {
    view: PreviewFallback,
    normalize: normalizeFallbackEvent,
  },
};

const { view, normalize } =
  EVENT_TYPE_COMPONENTS_MAP[props.event.type as EventType];
</script>

<template>
  <component :is="view" :event="normalize(event)" />
</template>