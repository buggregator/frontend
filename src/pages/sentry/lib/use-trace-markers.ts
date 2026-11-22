import { ref, watch, type Ref } from 'vue'
import { useSentryRequests, type TimelineMarker } from '@/entities/sentry'
import type { SentryTraceDetail } from '@/entities/sentry/types'
import { describeLoadError, useEventsRequests } from '@/shared/lib/io'
import { traceMarkers } from './trace-markers'

// Loads what the request timeline adds to the spans (#6715): the events of
// other modules with the trace id and the trace's first page of Sentry logs.
// A failed load leaves the spans on screen and says what is missing.
export const useTraceMarkers = (detail: Ref<SentryTraceDetail | null>) => {
  const { getByTrace } = useEventsRequests()
  const { getTraceLogs } = useSentryRequests()
  const markers = ref<TimelineMarker[]>([])
  const error = ref('')

  let last = 0
  watch(
    () => detail.value?.trace_id,
    async (traceId) => {
      const id = ++last
      markers.value = []
      error.value = ''
      const d = detail.value
      if (!traceId || !d) return

      const [events, logs] = await Promise.allSettled([
        getByTrace(traceId),
        d.related_log_count ? getTraceLogs(traceId, 1) : Promise.resolve(null)
      ])
      if (id !== last) return
      markers.value = traceMarkers(
        d.transaction.start_ts,
        events.status === 'fulfilled' ? events.value : [],
        d.related_errors,
        logs.status === 'fulfilled' && logs.value ? logs.value.data : []
      )
      const failed = [events, logs].find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) error.value = describeLoadError(failed.reason)
    },
    { immediate: true }
  )

  return { markers, error }
}
