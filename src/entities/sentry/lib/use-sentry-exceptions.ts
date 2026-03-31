import { ref, reactive } from 'vue'
import type { SentryExceptionItem, SentryErrorGroup, SentryExceptionDetail } from '../types'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryExceptions = () => {
  const { getExceptions, getExceptionsGrouped, getExceptionDetail } = useSentryRequests()

  const grouped = ref(false)
  const items = ref<SentryExceptionItem[]>([])
  const groupedItems = ref<SentryErrorGroup[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const filters = reactive<{ level: string | null; handled: string | null }>({
    level: null,
    handled: null,
  })

  const buildParams = () => {
    const params: Record<string, string> = { page: String(page.value) }
    if (filters.level) params.level = filters.level
    if (filters.handled !== null) params.handled = filters.handled
    return params
  }

  const fetchList = async () => {
    loading.value = true
    try {
      if (grouped.value) {
        const res = await getExceptionsGrouped(buildParams())
        groupedItems.value = res.data
        total.value = res.meta.total
      } else {
        const res = await getExceptions(buildParams())
        items.value = res.data
        total.value = res.meta.total
      }
    } finally {
      loading.value = false
    }
  }

  const fetchDetail = async (id: string): Promise<SentryExceptionDetail> => {
    return getExceptionDetail(id)
  }

  return {
    grouped,
    items,
    groupedItems,
    loading,
    total,
    page,
    filters,
    fetchList,
    fetchDetail,
  }
}
