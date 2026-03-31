import { ref, reactive } from 'vue'
import type { SentryLog } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryLogs = () => {
  const { getLogs } = useSentryRequests()

  const logs = ref<SentryLog[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const filters = reactive<{ level: string | null; traceId: string | null }>({
    level: null,
    traceId: null,
  })

  const fetchList = async () => {
    loading.value = true
    try {
      const params: Record<string, string> = { page: String(page.value) }
      if (filters.level) params.level = filters.level
      if (filters.traceId) params.trace_id = filters.traceId
      const res = await getLogs(params)
      logs.value = res.data
      total.value = res.meta.total
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    loading,
    total,
    page,
    filters,
    fetchList,
  }
}
