import { ref, reactive } from 'vue'
import type { SentryMetric } from '../types'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryMetrics = () => {
  const { getMetrics } = useSentryRequests()

  const metrics = ref<SentryMetric[]>([])
  const filters = reactive<{
    name: string | null
    search: string | null
    type: string | null
    traceId: string | null
  }>({
    name: null,
    search: null,
    type: null,
    traceId: null,
  })

  const list = useSentryPagedList(
    (page) => {
      const params: Record<string, string> = { page: String(page) }
      if (filters.name) params.name = filters.name
      if (filters.search) params.search = filters.search
      if (filters.type) params.type = filters.type
      if (filters.traceId) params.trace_id = filters.traceId
      return getMetrics(params)
    },
    (res) => { metrics.value = res.data },
  )

  return { metrics, ...list, filters }
}
