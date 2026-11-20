import { ref, reactive } from 'vue'
import type { SentryLog } from '../types'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryLogs = () => {
  const { getLogs } = useSentryRequests()

  const logs = ref<SentryLog[]>([])
  // level: one level or several, comma-separated ("warn,warning")
  // source: 'sentry' | 'otel' (#6523); null for both.
  const filters = reactive<{ level: string | null; traceId: string | null; source: string | null }>({
    level: null,
    traceId: null,
    source: null,
  })

  const list = useSentryPagedList(
    (page) => {
      const params: Record<string, string> = { page: String(page) }
      if (filters.level) params.level = filters.level
      if (filters.traceId) params.trace_id = filters.traceId
      if (filters.source) params.source = filters.source
      return getLogs(params)
    },
    (res) => { logs.value = res.data },
  )

  return { logs, ...list, filters }
}
