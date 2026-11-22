import { storeToRefs } from 'pinia'
import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { describeLoadError } from '@/shared/lib/io'
import { useEventsStore } from '@/shared/stores'
import type { QueueJob, QueueJobDetail, QueueSummary } from '../../types'
import { isNotFound, onVisibleAgain } from '../crons/use-cron-monitors'
import { onSentryEvent } from '../use-sentry-events-bus'
import { useSentryPagedList } from '../use-sentry-paged-list'
import { useSentryRequests } from '../use-sentry-requests'

// Queue jobs (#6713). An attempt is a `queue.process` transaction, so new
// ones come with `sentry.stored` kind `trace`; the lists also refetch when
// the browser tab comes back into view, in case the socket was down.

/**
 * Totals and queues of the selected project and period. `unsupported`: the
 * server has no /api/sentry/queues (older than buggregator/server #493).
 */
export const useQueueSummary = () => {
  const { getQueueSummary } = useSentryRequests()
  const { activeProjectKey, period } = storeToRefs(useEventsStore())
  const summary = ref<QueueSummary | null>(null)
  const hasLoaded = ref(false)
  const error = ref('')
  const unsupported = ref(false)
  let last = 0

  const fetchSummary = async () => {
    const current = ++last
    try {
      const res = await getQueueSummary()
      if (current !== last) return
      summary.value = res
      error.value = ''
      unsupported.value = false
    } catch (e) {
      if (current !== last) return
      if (isNotFound(e)) {
        summary.value = null
        unsupported.value = true
        error.value = ''
      } else {
        // A failed refresh keeps the numbers it had.
        error.value = describeLoadError(e)
      }
    } finally {
      if (current === last) hasLoaded.value = true
    }
  }

  watch([activeProjectKey, period], () => {
    hasLoaded.value = false
    fetchSummary()
  })
  onSentryEvent(fetchSummary, ['trace'])
  onVisibleAgain(fetchSummary)

  fetchSummary()

  return { summary, hasLoaded, error, unsupported, fetchSummary }
}

const PAGE = 50

export type QueueJobFilters = {
  // '' is every queue.
  queue: MaybeRefOrGetter<string>
  failedOnly: MaybeRefOrGetter<boolean>
}

/**
 * The jobs of the project and period, newest first, in pages of 50: «Show
 * more» adds the next page; a live refresh keeps the rows already shown.
 */
export const useQueueJobs = (filters: QueueJobFilters) => {
  const { getQueueJobs } = useSentryRequests()
  const { activeProjectKey, period } = storeToRefs(useEventsStore())
  const jobs = ref<QueueJob[]>([])
  // Rows asked for on page 1: a refresh asks for all the rows shown.
  let firstPage = PAGE

  const params = (page: number): Record<string, string> => {
    const p: Record<string, string> = { page: String(page), limit: String(page === 1 ? firstPage : PAGE) }
    const queue = toValue(filters.queue)
    if (queue) p.queue = queue
    if (toValue(filters.failedOnly)) p.status = 'failed'
    return p
  }

  const list = useSentryPagedList(
    (page) => getQueueJobs(params(page)),
    (res) => {
      if (list.page.value === 1) {
        jobs.value = res.data ?? []
        return
      }
      const seen = new Set(jobs.value.map((j) => j.id))
      jobs.value = [...jobs.value, ...(res.data ?? []).filter((j) => !seen.has(j.id))]
    }
  )

  /** Start over: another filter, project or period. */
  const reset = () => {
    firstPage = PAGE
    list.page.value = 1
    list.hasLoaded.value = false
    jobs.value = []
    list.fetchList()
  }

  /** Refetch what is shown. */
  const refresh = () => {
    firstPage = Math.min(500, Math.max(PAGE, jobs.value.length))
    list.page.value = 1
    list.fetchList()
  }

  const hasMore = computed(() => jobs.value.length < list.total.value)
  const loadingMore = computed(() => list.loading.value && list.page.value > 1)

  const loadMore = () => {
    if (list.loading.value || !hasMore.value) return
    // Pages of PAGE rows: the next one after what is shown.
    list.page.value = Math.floor(jobs.value.length / PAGE) + 1
    list.fetchList()
  }

  watch([activeProjectKey, period, () => toValue(filters.queue), () => toValue(filters.failedOnly)], reset)
  onSentryEvent(refresh, ['trace'])
  onVisibleAgain(refresh)

  list.fetchList()

  return { jobs, ...list, hasMore, loadingMore, loadMore, refresh }
}

/**
 * One job and its attempts. `notFound`: no such job (or a server without
 * queues). New attempts and their errors come live.
 */
export const useQueueJob = (id: MaybeRefOrGetter<string>) => {
  const { getQueueJob } = useSentryRequests()
  const job = ref<QueueJobDetail | null>(null)
  const hasLoaded = ref(false)
  const error = ref('')
  const notFound = ref(false)
  let last = 0

  const load = async () => {
    const current = ++last
    try {
      const res = await getQueueJob(toValue(id))
      if (current !== last) return
      job.value = res
      notFound.value = false
      error.value = ''
    } catch (e) {
      if (current !== last) return
      if (isNotFound(e)) {
        notFound.value = true
        job.value = null
        error.value = ''
      } else {
        error.value = describeLoadError(e)
      }
    } finally {
      if (current === last) hasLoaded.value = true
    }
  }

  watch(
    () => toValue(id),
    () => {
      hasLoaded.value = false
      notFound.value = false
      job.value = null
      load()
    },
    { immediate: true }
  )
  onSentryEvent(load, ['trace', 'error'])
  onVisibleAgain(load)

  return { job, hasLoaded, error, notFound, reload: load }
}
