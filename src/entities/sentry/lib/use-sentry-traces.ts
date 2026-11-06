import { ref } from 'vue'
import type { SentryTrace, SentryTraceDetail } from '../types'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryTraces = () => {
  const { getTraces, getTraceDetail } = useSentryRequests()

  const traces = ref<SentryTrace[]>([])

  const list = useSentryPagedList(
    (page) => getTraces({ page: String(page) }),
    (res) => { traces.value = res.data },
  )

  const fetchDetail = async (traceId: string): Promise<SentryTraceDetail> => {
    return getTraceDetail(traceId)
  }

  return { traces, ...list, fetchDetail }
}
