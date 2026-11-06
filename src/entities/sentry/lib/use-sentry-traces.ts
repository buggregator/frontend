import { computed, ref } from 'vue'
import type { SentryTrace, SentryTraceDetail } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryTraces = () => {
  const { getTraces, getTraceDetail } = useSentryRequests()

  const traces = ref<SentryTrace[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  // A first load and a background refresh are different things. The
  // "Loading..." placeholder is only shown while there is nothing to show: on a
  // WebSocket-driven refresh the list stays in place, otherwise the UI flickers
  // on every incoming event.
  const isInitialLoading = computed(() => loading.value && !hasLoaded.value)
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
      hasLoaded.value = true
    }
  }

  const fetchDetail = async (traceId: string): Promise<SentryTraceDetail> => {
    return getTraceDetail(traceId)
  }

  return {
    traces,
    loading,
    hasLoaded,
    isInitialLoading,
    total,
    page,
    fetchList,
    fetchDetail,
  }
}
