<script lang="ts" setup generic="T">
import { computed, defineProps } from 'vue';
import {
  useHttpDump,
  PreviewCard as PreviewHttpDump,
} from '@/entities/http-dump';
import {
  useInspector,
  PreviewCard as PreviewInspector,
} from '@/entities/inspector';
import { useMonolog, PreviewCard as PreviewMonolog } from '@/entities/monolog';
import {
  useProfiler,
  PreviewCard as PreviewProfiler,
} from '@/entities/profiler';
import { useRay, PreviewCard as PreviewRay } from '@/entities/ray';
import { useSentry, PreviewCard as PreviewSentry } from '@/entities/sentry';
import { useSmtp, PreviewCard as PreviewSMTP } from '@/entities/smtp';
import {
  useVarDump,
  PreviewCard as PreviewVarDump,
} from '@/entities/var-dump';
import { useEvents } from '@/shared/lib/use-events';
import {
  type ServerEvent,
  type EventType,
  type MappedEventsProps,
  EventTypes,
} from '@/shared/types';
import { PreviewCardDefault } from '../preview-card-default';

const { normalizeRayEvent } = useRay();

const { normalizeProfilerEvent } = useProfiler();
const { normalizeVarDumpEvent } = useVarDump();
const { normalizeMonologEvent } = useMonolog();
const { normalizeSentryEvent } = useSentry();
const { normalizeSmtpEvent } = useSmtp();
const { normalizeInspectorEvent } = useInspector();
const { normalizeHttpDumpEvent } = useHttpDump();
const { normalizeUnknownEvent } = useEvents();

type Props = {
  event: ServerEvent<T>;
};

const props = defineProps<Props>();

type EventTypeComponentsMap = Record<EventTypes, MappedEventsProps<unknown>>;

const EVENT_TYPE_COMPONENTS_MAP: EventTypeComponentsMap = {
  [EventTypes.Sentry]: {
    view: PreviewSentry,
    normalize: normalizeSentryEvent,
  },
  [EventTypes.Monolog]: {
    view: PreviewMonolog,
    normalize: normalizeMonologEvent,
  },
  [EventTypes.VarDump]: {
    view: PreviewVarDump,
    normalize: normalizeVarDumpEvent,
  },
  [EventTypes.RayDump]: {
    view: PreviewRay,
    normalize: normalizeRayEvent,
  },
  [EventTypes.Smtp]: {
    view: PreviewSMTP,
    normalize: normalizeSmtpEvent,
  },
  [EventTypes.Profiler]: {
    view: PreviewProfiler,
    normalize: normalizeProfilerEvent,
  },
  [EventTypes.Inspector]: {
    view: PreviewInspector,
    normalize: normalizeInspectorEvent,
  },
  [EventTypes.HttpDump]: {
    view: PreviewHttpDump,
    normalize: normalizeHttpDumpEvent,
  },
  unknown: {
    view: PreviewCardDefault,
    normalize: normalizeUnknownEvent,
  },
} as EventTypeComponentsMap;

const componentConfig = computed(
  () => EVENT_TYPE_COMPONENTS_MAP[props.event.type as EventType],
);

const view = computed(
  () => componentConfig?.value?.view ?? PreviewCardDefault,
);
const normalize = computed(
  () => componentConfig?.value?.normalize ?? normalizeUnknownEvent,
);

</script>

<template>
  <component
    :is="view"
    :event="normalize(event)"
  />
</template>
