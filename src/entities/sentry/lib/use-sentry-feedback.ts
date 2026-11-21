import { ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { describeLoadError } from '@/shared/lib/io'
import type { SentryFeedback } from '../types'
import { onSentryEvent } from './use-sentry-events-bus'
import { useSentryPagedList } from './use-sentry-paged-list'
import { useSentryRequests } from './use-sentry-requests'

// User feedback (#6604): what people wrote in the Sentry feedback widget.

/** All feedback of the project and period, for the Feedback tab. */
export const useSentryFeedbackList = () => {
  const { getFeedback } = useSentryRequests()
  const items = ref<SentryFeedback[]>([])

  const list = useSentryPagedList(
    (page) => getFeedback({ page: String(page) }),
    (res) => {
      items.value = res.data
    }
  )

  return { items, ...list }
}

/**
 * The feedback on one error. Older servers answer 404 for the route: that
 * is no feedback, not an error to show.
 */
export const useEventFeedback = (eventId: MaybeRefOrGetter<string>) => {
  const { getEventFeedback } = useSentryRequests()
  const items = ref<SentryFeedback[]>([])
  const error = ref('')
  let last = 0

  const load = async () => {
    const id = toValue(eventId)
    const current = ++last
    if (!id) {
      items.value = []
      return
    }
    try {
      const res = await getEventFeedback(id)
      if (current !== last) return
      items.value = res.data ?? []
      error.value = ''
    } catch (e) {
      if (current !== last) return
      if ((e as { status?: number }).status === 404) {
        items.value = []
        error.value = ''
      } else {
        error.value = describeLoadError(e)
      }
    }
  }

  watch(() => toValue(eventId), load, { immediate: true })

  // Feedback often comes seconds after its error.
  onSentryEvent(load, ['feedback'])

  return { items, error, reload: load }
}
