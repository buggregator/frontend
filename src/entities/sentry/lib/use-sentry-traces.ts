import { reactive, ref } from 'vue'
import type { SentryTrace, SentryTraceDetail } from '../types'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryTraces = () => {
  const { getTraces, getTraceDetail } = useSentryRequests()

  const traces = ref<SentryTrace[]>([])

  // source: 'sentry' | 'otel' (#6523); null for both. service: traces that
  // pass through this service (#6544, the service map's «Traces» button).
  const filters = reactive<{ source: string | null; service: string | null }>({ source: null, service: null })

  const list = useSentryPagedList(
    (page) => {
      const params: Record<string, string> = { page: String(page) }
      if (filters.source) params.source = filters.source
      if (filters.service) params.service = filters.service
      return getTraces(params)
    },
    (res) => { traces.value = res.data },
  )

  const fetchDetail = async (traceId: string): Promise<SentryTraceDetail> => {
    return getTraceDetail(traceId)
  }

  return { traces, ...list, filters, fetchDetail }
}
