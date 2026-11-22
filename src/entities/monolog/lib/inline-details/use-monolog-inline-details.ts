import { computed, ref, watch, type Ref } from 'vue'
import type { EventId } from '@/shared/types'
import { hasEntries } from '../has-entries'

type Details = {
  context?: Record<string, unknown> | unknown[]
  extra?: Record<string, unknown> | unknown[]
  context_truncated?: boolean
  extra_truncated?: boolean
}

// Same limit as the server's preview: bigger values start folded in the card.
const BIG_JSON_BYTES = 2048
const isBig = (value: unknown) => value !== null && JSON.stringify(value).length > BIG_JSON_BYTES

// How far a JSON tree of this value starts open: a big one starts folded to
// its top-level keys (the feed card and the event page use the same rule).
export const jsonOpenDepth = (value: unknown) => (isBig(value) ? -1 : 1)

type FetchFull = (id: EventId) => Promise<{ payload: unknown } | null>

// Monolog context and extra under the message in the feed, when the setting is
// on (frontend#283). The feed preview carries them when they are small; when
// the server cut them, or an older server sends none, the full event is fetched
// once for this card.
export const useMonologInlineDetails = (
  id: EventId,
  // The event payload as the feed got it.
  payload: object,
  enabled: Ref<boolean>,
  fetchFull: FetchFull,
) => {
  const preview = payload as Details
  const full = ref<Details | null>(null)
  let requested = false

  const needsFull = preview.context_truncated === true ||
    preview.extra_truncated === true ||
    !('context' in preview)

  watch(enabled, async (on) => {
    if (!on || !needsFull || requested) {
      return
    }
    requested = true

    try {
      const event = await fetchFull(id)
      full.value = (event?.payload as Details | undefined) ?? null
    } catch {
      // The card stays as it is: the event page still has everything.
    }
  }, { immediate: true })

  const source = computed<Details>(() => full.value ?? preview)

  // The source file is shown in the card header already.
  const context = computed(() => {
    const ctx = source.value.context
    if (!ctx) {
      return null
    }
    if (Array.isArray(ctx)) {
      return ctx.length ? ctx : null
    }
    const rest = Object.fromEntries(Object.entries(ctx).filter(([key]) => key !== 'source'))

    return Object.keys(rest).length ? rest : null
  })

  const extra = computed(() => (hasEntries(source.value.extra) ? source.value.extra! : null))

  const isShown = computed(() => enabled.value && (context.value !== null || extra.value !== null))

  const isContextBig = computed(() => isBig(context.value))
  const isExtraBig = computed(() => isBig(extra.value))

  return { context, extra, isShown, isContextBig, isExtraBig }
}
