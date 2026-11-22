import { useDocumentVisibility, useNow } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { describeLoadError } from '@/shared/lib/io'
import { useEventsStore } from '@/shared/stores'
import type { CronCheckIn, CronMonitor } from '../../types'
import { onSentryEvent } from '../use-sentry-events-bus'
import { useSentryRequests } from '../use-sentry-requests'

// Cron monitors (#6617). Live: every check-in and every run the server's
// checker marks missed or timed out sends `sentry.stored` with kind `cron`
// (server modules/sentry/cron_ingest.go, cron_checker.go); the list also
// refetches when the tab comes back into view, in case the socket was down.

/** A 404: the route or the item is not there (also used by queue jobs, #6713). */
export const isNotFound = (e: unknown) => (e as { status?: number })?.status === 404

/** «now» for relative times, moving every 15 s. */
export const useCronClock = () => {
  const now = useNow({ interval: 15_000 })
  return computed(() => now.value.getTime())
}

// Refetch when the page is seen again after being hidden.
export const onVisibleAgain = (load: () => void) => {
  const visibility = useDocumentVisibility()
  watch(visibility, (v, old) => {
    if (v === 'visible' && old === 'hidden') load()
  })
}

/**
 * The monitors of the selected project. `unsupported`: the server has no
 * /api/crons (older than buggregator/server #483), so the tab hides.
 */
export const useCronMonitors = () => {
  const { getCronMonitors } = useSentryRequests()
  const { activeProjectKey } = storeToRefs(useEventsStore())
  const monitors = ref<CronMonitor[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')
  const unsupported = ref(false)
  let last = 0

  const fetchMonitors = async () => {
    const current = ++last
    loading.value = true
    try {
      const res = await getCronMonitors()
      if (current !== last) return
      monitors.value = res.data ?? []
      error.value = ''
      unsupported.value = false
    } catch (e) {
      if (current !== last) return
      if (isNotFound(e)) {
        // No crons on this server: nothing to keep.
        monitors.value = []
        unsupported.value = true
        error.value = ''
      } else {
        // A failed refresh keeps the list it had: the page shows it with
        // a «Could not refresh» line over it.
        error.value = describeLoadError(e)
      }
    } finally {
      if (current === last) {
        loading.value = false
        hasLoaded.value = true
      }
    }
  }

  watch(activeProjectKey, () => {
    hasLoaded.value = false
    fetchMonitors()
  })
  onSentryEvent(fetchMonitors, ['cron'])
  onVisibleAgain(fetchMonitors)

  const isInitialLoading = computed(() => !hasLoaded.value)

  fetchMonitors()

  return { monitors, loading, hasLoaded, isInitialLoading, error, unsupported, fetchMonitors }
}

const PAGE = 50

/**
 * One monitor and its runs, newest first. `notFound`: no such monitor in the
 * project (or a server without crons).
 */
export const useCronJob = (slug: MaybeRefOrGetter<string>, project: MaybeRefOrGetter<string>) => {
  const { getCronMonitors, getCronCheckIns } = useSentryRequests()
  const monitor = ref<CronMonitor | null>(null)
  const checkins = ref<CronCheckIn[]>([])
  const total = ref(0)
  const hasLoaded = ref(false)
  const loadingOlder = ref(false)
  const error = ref('')
  const notFound = ref(false)
  let last = 0
  // Bumped on a switch to another job: an older page asked for the previous
  // one is dropped when it comes.
  let job = 0

  const load = async () => {
    const current = ++last
    const s = toValue(slug)
    const p = toValue(project) || 'default'
    // A refresh keeps the older pages the user opened.
    const limit = Math.min(500, Math.max(PAGE, checkins.value.length))
    try {
      const [list, runs] = await Promise.all([getCronMonitors(p), getCronCheckIns(s, { project: p, limit })])
      if (current !== last) return
      const found = (list.data ?? []).find((m) => m.slug === s && m.project === p) ?? null
      monitor.value = found
      notFound.value = !found
      checkins.value = runs.data ?? []
      total.value = runs.meta?.total ?? checkins.value.length
      error.value = ''
    } catch (e) {
      if (current !== last) return
      if (isNotFound(e)) {
        notFound.value = true
        monitor.value = null
        checkins.value = []
        error.value = ''
      } else {
        error.value = describeLoadError(e)
      }
    } finally {
      if (current === last) hasLoaded.value = true
    }
  }

  const loadOlder = async () => {
    if (loadingOlder.value || checkins.value.length >= total.value) return
    loadingOlder.value = true
    const asked = job
    const p = toValue(project) || 'default'
    try {
      // Pages of PAGE rows: the next one after what is shown.
      const page = Math.floor(checkins.value.length / PAGE) + 1
      const res = await getCronCheckIns(toValue(slug), { project: p, page, limit: PAGE })
      if (asked !== job) return
      const seen = new Set(checkins.value.map((c) => c.id))
      checkins.value = [...checkins.value, ...(res.data ?? []).filter((c) => !seen.has(c.id))]
      total.value = res.meta?.total ?? total.value
    } catch (e) {
      if (asked === job) error.value = describeLoadError(e)
    } finally {
      if (asked === job) loadingOlder.value = false
    }
  }

  watch(
    () => [toValue(slug), toValue(project)],
    () => {
      job++
      hasLoaded.value = false
      loadingOlder.value = false
      notFound.value = false
      monitor.value = null
      checkins.value = []
      load()
    },
    { immediate: true }
  )
  onSentryEvent(load, ['cron'])
  onVisibleAgain(load)

  const hasOlder = computed(() => checkins.value.length < total.value)

  return { monitor, checkins, total, hasLoaded, loadingOlder, hasOlder, error, notFound, reload: load, loadOlder }
}
