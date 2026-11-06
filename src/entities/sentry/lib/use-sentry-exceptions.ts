import { ref, reactive } from 'vue'
import type { SentryExceptionItem, SentryErrorGroup, SentryExceptionDetail } from '../types'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

export const useSentryExceptions = () => {
  const { getExceptions, getExceptionsGrouped, getExceptionDetail } = useSentryRequests()

  const grouped = ref(false)
  const items = ref<SentryExceptionItem[]>([])
  const groupedItems = ref<SentryErrorGroup[]>([])
  const filters = reactive<{ level: string | null; handled: string | null }>({
    level: null,
    handled: null,
  })

  const list = useSentryPagedList(
    async (page) => {
      const params: Record<string, string> = { page: String(page) }
      if (filters.level) params.level = filters.level
      if (filters.handled !== null) params.handled = filters.handled
      // The answer is put into the list of the mode it was asked for.
      return grouped.value
        ? { grouped: true as const, ...(await getExceptionsGrouped(params)) }
        : { grouped: false as const, ...(await getExceptions(params)) }
    },
    (res) => {
      if (res.grouped) groupedItems.value = res.data
      else items.value = res.data
    },
  )

  const fetchDetail = async (id: string): Promise<SentryExceptionDetail> => {
    return getExceptionDetail(id)
  }

  return { grouped, items, groupedItems, ...list, filters, fetchDetail }
}
