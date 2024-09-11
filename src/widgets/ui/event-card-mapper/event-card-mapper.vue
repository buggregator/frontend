<script lang="ts" setup generic="T">
import { defineProps } from 'vue'
import { useHttpDump, PreviewCard as PreviewHttpDump } from '@/entities/http-dump'
import { useInspector, PreviewCard as PreviewInspector } from '@/entities/inspector'
import { useMonolog, PreviewCard as PreviewMonolog } from '@/entities/monolog'
import { useProfiler, PreviewCard as PreviewProfiler } from '@/entities/profiler'
import { useRay, PreviewCard as PreviewRay } from '@/entities/ray'
import { useSentry, PreviewCard as PreviewSentry } from '@/entities/sentry'
import { useSmtp, PreviewCard as PreviewSMTP } from '@/entities/smtp'
import { useVarDump, PreviewCard as PreviewVarDump } from '@/entities/var-dump'
import { useEvents } from '@/shared/lib/use-events'
import type { ServerEvent, EventType } from '@/shared/types'
import { EVENT_TYPES } from '@/shared/types'
import { PreviewCardDefault } from '../preview-card-default'

const { normalizeRayEvent } = useRay()

const { normalizeProfilerEvent } = useProfiler()
const { normalizeVarDumpEvent } = useVarDump()
const { normalizeMonologEvent } = useMonolog()
const { normalizeSentryEvent } = useSentry()
const { normalizeSmtpEvent } = useSmtp()
const { normalizeInspectorEvent } = useInspector()
const { normalizeHttpDumpEvent } = useHttpDump()
const { normalizeUnknownEvent } = useEvents()

type Props = {
  event: ServerEvent<T>
}

const props = defineProps<Props>()

const EVENT_TYPE_COMPONENTS_MAP = {
  [EVENT_TYPES.SENTRY]: {
    view: PreviewSentry,
    normalize: normalizeSentryEvent
  },
  [EVENT_TYPES.MONOLOG]: {
    view: PreviewMonolog,
    normalize: normalizeMonologEvent
  },
  [EVENT_TYPES.VAR_DUMP]: {
    view: PreviewVarDump,
    normalize: normalizeVarDumpEvent
  },
  [EVENT_TYPES.RAY_DUMP]: {
    view: PreviewRay,
    normalize: normalizeRayEvent
  },
  [EVENT_TYPES.SMTP]: {
    view: PreviewSMTP,
    normalize: normalizeSmtpEvent
  },
  [EVENT_TYPES.PROFILER]: {
    view: PreviewProfiler,
    normalize: normalizeProfilerEvent
  },
  [EVENT_TYPES.INSPECTOR]: {
    view: PreviewInspector,
    normalize: normalizeInspectorEvent
  },
  [EVENT_TYPES.HTTP_DUMP]: {
    view: PreviewHttpDump,
    normalize: normalizeHttpDumpEvent
  },
  unknown: {
    view: PreviewCardDefault,
    normalize: normalizeUnknownEvent
  }
}

const { view, normalize } = EVENT_TYPE_COMPONENTS_MAP[props.event.type as EventType]
</script>

<template>
  <component :is="view" :event="normalize(event)" />
</template>
