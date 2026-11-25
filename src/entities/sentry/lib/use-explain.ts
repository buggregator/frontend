import type { PublicationContext } from 'centrifuge'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { guardHandler, REST_API_URL, useCentrifuge } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'

// «Explain this error» (concept, server feat/explain-error): the error goes
// through harnsy (h2a) to the project's agents; their answers come back into
// the thread under the error.

export type ExplainMessage = {
  from: 'you' | 'agent'
  role?: string
  project?: string
  text: string
  at: string
}

export type ExplainThread = {
  event_uuid: string
  project: string
  conversation: string
  messages: ExplainMessage[]
}

export type ExplainStatus = {
  enabled: boolean
  status: 'connecting' | 'connected' | 'stopped'
  reason?: string
  project?: string
  to: string
}

const BASE = `${REST_API_URL}/api/explain`

// While the last word is ours, check the thread now and then: the WebSocket
// push may come on a channel this tab does not follow.
const POLL_MS = 5000

type ApiError = Error & { status?: number; code?: string }

const errorText = (e: unknown): string => {
  const err = e as ApiError
  switch (err.code) {
    case 'explain_offline':
      return 'Not connected to harnsy right now.'
    case 'explain_timeout':
      return 'harnsy did not take the message in time. Try again.'
    case 'h2a_rate':
    case 'h2a_daily':
      return 'Too many questions for now. Try again later.'
    case 'h2a_no_holder':
      return 'Nobody in the project is there to answer.'
    default:
      return err.message || 'Request failed'
  }
}

export const useExplain = (eventUuid: MaybeRefOrGetter<string>) => {
  const { token } = storeToRefs(useProfileStore())

  const status = ref<ExplainStatus | null>(null)
  const thread = ref<ExplainThread | null>(null)
  const sending = ref(false)
  const error = ref('')

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'X-Auth-Token': token.value, 'Content-Type': 'application/json' }
    })
    // Feature off: the SPA fallback answers 200 with HTML. Not JSON = no API.
    const body = await res.json().catch(() => null)
    if (body === null) {
      throw Object.assign(new Error(`Request failed: ${res.status}`), { status: 404 })
    }
    if (!res.ok) {
      throw Object.assign(new Error(body.error || `Request failed: ${res.status}`), {
        status: res.status,
        code: body.code
      })
    }
    return body as T
  }

  // Off on the server (no url + token): 404, the button stays hidden.
  const loadStatus = async () => {
    try {
      status.value = await request<ExplainStatus>('')
    } catch {
      status.value = null
    }
  }

  const loadThread = async () => {
    const id = toValue(eventUuid)
    if (!id) return
    try {
      const th = await request<ExplainThread>(`/event/${id}`)
      if (id === toValue(eventUuid)) thread.value = th
    } catch (e) {
      if ((e as ApiError).status === 404) thread.value = null
    }
  }

  const post = async (path: string, text: string) => {
    sending.value = true
    error.value = ''
    try {
      thread.value = await request<ExplainThread>(path, {
        method: 'POST',
        body: JSON.stringify({ text })
      })
      return true
    } catch (e) {
      error.value = errorText(e)
      return false
    } finally {
      sending.value = false
    }
  }

  const explain = (question = '') => post(`/event/${toValue(eventUuid)}`, question.trim())

  const followUp = (text: string) => {
    const t = text.trim()
    if (!t) return Promise.resolve(false)
    return post(`/event/${toValue(eventUuid)}/messages`, t)
  }

  // A new answer (or our follow-up from another tab) for this event.
  const onPublication = guardHandler('publication', (ctx: PublicationContext) => {
    if (ctx.data?.event !== 'explain.message') return
    if (ctx.data?.data?.event_uuid !== toValue(eventUuid)) return
    loadThread()
  })
  const { centrifuge } = useCentrifuge()
  centrifuge.on('publication', onPublication)

  // Our message is the last one: an answer is on its way.
  const waiting = computed(() => {
    const msgs = thread.value?.messages ?? []
    return msgs.length > 0 && msgs[msgs.length - 1].from === 'you'
  })
  const timer = setInterval(() => {
    if (waiting.value) loadThread()
  }, POLL_MS)

  onUnmounted(() => {
    centrifuge.removeListener('publication', onPublication)
    clearInterval(timer)
  })

  watch(
    () => toValue(eventUuid),
    () => {
      thread.value = null
      error.value = ''
      loadThread()
    },
    { immediate: true }
  )
  loadStatus()

  return { status, thread, sending, error, waiting, explain, followUp, reload: loadThread }
}
