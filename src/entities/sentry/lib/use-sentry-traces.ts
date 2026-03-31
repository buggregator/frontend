import { ref } from 'vue'
import type { SentryTrace, SentryTraceDetail } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryTraces = () => {
  const { getTraces, getTraceDetail } = useSentryRequests()

  const traces = ref<SentryTrace[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await getTraces({ page: String(page.value) })
      traces.value = res.data
      total.value = res.meta.total
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (traceId: string): Promise<SentryTraceDetail> => {
    return getTraceDetail(traceId)
  }

  return {
    traces,
    loading,
    total,
    page,
    fetchList,
    fetchDetail,
  }
}
