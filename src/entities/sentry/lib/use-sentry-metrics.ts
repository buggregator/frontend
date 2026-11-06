import { ref, reactive } from 'vue'
import type { SentryMetric } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryMetrics = () => {
  const { getMetrics } = useSentryRequests()

  const metrics = ref<SentryMetric[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const filters = reactive<{ name: string | null; type: string | null; traceId: string | null }>({
    name: null,
    type: null,
    traceId: null,
  })

  const fetchList = async () => {
    loading.value = true
    try {
      const params: Record<string, string> = { page: String(page.value) }
      if (filters.name) params.name = filters.name
      if (filters.type) params.type = filters.type
      if (filters.traceId) params.trace_id = filters.traceId
      const res = await getMetrics(params)
      metrics.value = res.data
      total.value = res.meta.total
    } finally {
      loading.value = false
    }
  }

  return {
    metrics,
    loading,
    total,
    page,
    filters,
    fetchList,
  }
}
