import { computed, ref, reactive } from 'vue'
import { describeLoadError } from '@/shared/lib/io'
import type { SentryLog } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryLogs = () => {
  const { getLogs } = useSentryRequests()

  const logs = ref<SentryLog[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  // Why the last load failed; the page shows it instead of the empty state.
  const error = ref('')
  // A first load and a background refresh are different things. The
  // "Loading..." placeholder is only shown while there is nothing to show: on a
  // WebSocket-driven refresh the list stays in place, otherwise the UI flickers
  // on every incoming event.
  const isInitialLoading = computed(() => loading.value && !hasLoaded.value)
  const total = ref(0)
  const page = ref(1)
  // level: one level or several, comma-separated ("warn,warning")
  const filters = reactive<{ level: string | null; traceId: string | null }>({
    level: null,
    traceId: null,
  })

  // A filter typed letter by letter starts several requests: only the last one's answer counts
  let lastRequest = 0

  const fetchList = async () => {
    const request = ++lastRequest
    loading.value = true
    try {
      const params: Record<string, string> = { page: String(page.value) }
      if (filters.level) params.level = filters.level
      if (filters.traceId) params.trace_id = filters.traceId
      const res = await getLogs(params)
      if (request !== lastRequest) return
      logs.value = res.data
      total.value = res.meta.total
      error.value = ''
    } catch (e) {
      if (request === lastRequest) {
        error.value = describeLoadError(e)
      }
    } finally {
      if (request === lastRequest) {
        loading.value = false
        hasLoaded.value = true
      }
    }
  }

  return {
    logs,
    loading,
    hasLoaded,
    error,
    isInitialLoading,
    total,
    page,
    filters,
    fetchList,
  }
}
