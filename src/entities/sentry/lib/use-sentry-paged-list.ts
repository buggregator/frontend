import { computed, ref } from 'vue'
import { describeLoadError } from '@/shared/lib/io'

// The paged list behind the Sentry logs, metrics, traces and exceptions tabs.
// `request` asks for a page; `apply` puts the answer into the caller's own
// list. Only the last request's answer counts: a filter typed letter by
// letter or a quick grouped/flat toggle starts several.
export const useSentryPagedList = <R extends { meta: { total: number } }>(
  request: (page: number) => Promise<R>,
  apply: (res: R) => void,
) => {
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

  let lastRequest = 0

  const fetchList = async () => {
    const current = ++lastRequest
    loading.value = true
    try {
      const res = await request(page.value)
      if (current !== lastRequest) return
      apply(res)
      total.value = res.meta.total
      error.value = ''
    } catch (e) {
      if (current === lastRequest) {
        error.value = describeLoadError(e)
      }
    } finally {
      if (current === lastRequest) {
        loading.value = false
        hasLoaded.value = true
      }
    }
  }

  return { loading, hasLoaded, error, isInitialLoading, total, page, fetchList }
}
