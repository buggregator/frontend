<script lang="ts" setup generic="T">
import { computed, defineProps } from 'vue'
import { useHttpDump, HttpDumpPage } from '@/entities/http-dump'
import { useInspector, InspectorPage } from '@/entities/inspector'
import { useMonolog, MonologPage } from '@/entities/monolog'
import { useProfiler, ProfilerPage } from '@/entities/profiler'
import { useRay } from '@/entities/ray'
import { useSentry, SentryPage } from '@/entities/sentry'
import { useSmtp, SmtpPage } from '@/entities/smtp'
import { useVarDump } from '@/entities/var-dump'
import { useEvents } from '@/shared/lib/use-events'
import { type ServerEvent, EventTypes } from '@/shared/types'
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
  [EventTypes.Sentry]: {
    view: SentryPage,
    normalize: normalizeSentryEvent
  },
  [EventTypes.Monolog]: {
    view: MonologPage,
    normalize: normalizeMonologEvent
  },
  [EventTypes.VarDump]: {
    view: PreviewCardDefault,
    normalize: normalizeVarDumpEvent
  },
  [EventTypes.RayDump]: {
    view: PreviewCardDefault,
    normalize: normalizeRayEvent
  },
  [EventTypes.Smtp]: {
    view: SmtpPage,
    normalize: normalizeSmtpEvent
  },
  [EventTypes.Profiler]: {
    view: ProfilerPage,
    normalize: normalizeProfilerEvent
  },
  [EventTypes.Inspector]: {
    view: InspectorPage,
    normalize: normalizeInspectorEvent
  },
  [EventTypes.HttpDump]: {
    view: HttpDumpPage,
    normalize: normalizeHttpDumpEvent
  },
  unknown: {
    view: PreviewCardDefault,
    normalize: normalizeUnknownEvent
  }
}

const componentConfig = computed(
  () => EVENT_TYPE_COMPONENTS_MAP[props.event.type as EventTypes] as unknown
)

const view = computed(() => componentConfig.value?.view ?? PreviewCardDefault)
const normalize = computed(() => componentConfig.value?.normalize ?? normalizeUnknownEvent)
</script>

<template>
  <component :is="view" :event="normalize(event)" />
</template>
