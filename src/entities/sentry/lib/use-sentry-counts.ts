import { ref } from 'vue'
import type { SentryCounts } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryCounts = () => {
  const { getCounts } = useSentryRequests()

  const counts = ref<SentryCounts>({ exceptions: 0, traces: 0, logs: 0 })
  const loading = ref(false)

  const fetchCounts = async () => {
    loading.value = true
    try {
      counts.value = await getCounts()
    } finally {
      loading.value = false
    }
  }

  return {
    counts,
    loading,
    fetchCounts,
  }
}
