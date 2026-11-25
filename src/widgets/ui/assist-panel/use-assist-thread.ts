import type { PublicationContext } from 'centrifuge'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { PageContext } from '@/shared/lib/assist'
import { guardHandler, useCentrifuge } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import {
  type AssistError,
  type AssistStatus,
  type AssistSummary,
  type AssistThread,
  assistErrorText,
  assistRequest
} from './assist-api'

// The panel's data: the connection state, the thread of the page on screen,
// sending with its errors, and the recent threads. Answers come by WebSocket
// (`assist.message`); while the last word is ours the thread is also checked
// every few seconds, since the push may come on a channel this tab does not
// follow (a page thread lives on the default project's channel).

const POLL_MS = 5000
// While not connected, the state is asked again now and then.
const STATUS_MS = 10000

export type AssistState = 'loading' | 'off' | 'connecting' | 'connected' | 'stopped'

export const assistStateOf = (s: AssistStatus | null | undefined, loaded: boolean): AssistState => {
  if (!loaded) return 'loading'
  if (!s || !s.enabled) return 'off'
  return s.status
}

const contextId = (ctx: PageContext | null) => (ctx ? `${ctx.kind}:${ctx.key}` : '')

export const useAssistThread = (context: Ref<PageContext | null>) => {
  const { token } = storeToRefs(useProfileStore())
  const call = <T>(path: string, init?: RequestInit) => assistRequest<T>(token.value, path, init)

  // Connection.
  const status = ref<AssistStatus | null>(null)
  const statusLoaded = ref(false)
  const state = computed(() => assistStateOf(status.value, statusLoaded.value))
  const loadStatus = async () => {
    try {
      status.value = await call<AssistStatus>('')
    } catch {
      status.value = null
    } finally {
      statusLoaded.value = true
    }
  }

  // The thread of the context on screen; threads already seen are kept, so
  // going back to a page shows its thread at once.
  const cache = new Map<string, AssistThread | null>()
  const thread = ref<AssistThread | null>(null)
  const threadLoading = ref(false)

  const loadThread = async () => {
    const ctx = context.value
    const id = contextId(ctx)
    if (!ctx) {
      thread.value = null
      return
    }
    threadLoading.value = !cache.has(id)
    try {
      const q = new URLSearchParams({ kind: ctx.kind, key: ctx.key })
      const th = await call<AssistThread>(`/threads?${q}`)
      cache.set(id, th)
      if (id === contextId(context.value)) thread.value = th
    } catch (e) {
      if ((e as AssistError).status === 404) {
        cache.set(id, null)
        if (id === contextId(context.value)) thread.value = null
      }
    } finally {
      if (id === contextId(context.value)) threadLoading.value = false
    }
  }

  // Sending. A failed question stays on screen with its error and «Try again».
  const sending = ref(false)
  const pending = ref('')
  const error = ref('')

  const start = (ctx: PageContext, text: string, fresh = false) =>
    call<AssistThread>('/threads', {
      method: 'POST',
      body: JSON.stringify({
        context: {
          kind: ctx.kind,
          key: ctx.key,
          title: ctx.title,
          ...(ctx.kind === 'page' ? { text: ctx.text ?? '', project: ctx.project || undefined } : {})
        },
        text,
        ...(fresh ? { new: true } : {})
      })
    })

  const followUp = (id: number, text: string) =>
    call<AssistThread>(`/threads/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) })

  const deliver = async (ctx: PageContext, text: string): Promise<AssistThread> => {
    const current = thread.value
    if (current) {
      try {
        return await followUp(current.id, text)
      } catch (e) {
        // The thread is gone on the server (cleared, its event deleted): start over.
        if ((e as AssistError).code !== 'assist_none') throw e
      }
    }
    try {
      return await start(ctx, text)
    } catch (e) {
      const err = e as AssistError
      // Another tab started it meanwhile: continue that one.
      if (err.code === 'assist_exists' && err.thread) return followUp(err.thread.id, text)
      throw e
    }
  }

  const send = async (raw: string): Promise<boolean> => {
    const text = raw.trim()
    const ctx = context.value
    if (!text || !ctx || sending.value) return false
    const id = contextId(ctx)
    sending.value = true
    pending.value = text
    error.value = ''
    try {
      const th = await deliver(ctx, text)
      cache.set(id, th)
      if (id === contextId(context.value)) {
        thread.value = th
        pending.value = ''
      }
      return true
    } catch (e) {
      if (id === contextId(context.value)) error.value = assistErrorText(e, status.value?.project)
      return false
    } finally {
      sending.value = false
    }
  }

  const retry = () => send(pending.value)

  // Our message is the last one: an answer is on its way.
  const waiting = computed(() => {
    const msgs = thread.value?.messages ?? []
    return msgs.length > 0 && msgs[msgs.length - 1].from === 'you'
  })

  // Recent threads, newest first.
  const recent = ref<AssistSummary[]>([])
  const loadRecent = async () => {
    try {
      recent.value = (await call<{ threads: AssistSummary[] }>('/threads?recent=10')).threads ?? []
    } catch {
      recent.value = []
    }
  }

  // An answer (or our follow-up from another tab).
  const onPublication = guardHandler('publication', (ctx: PublicationContext) => {
    if (ctx.data?.event !== 'assist.message') return
    const d = ctx.data?.data ?? {}
    const th = thread.value
    const c = context.value
    if ((th && d.thread_id === th.id) || (c && d.kind === c.kind && d.key === c.key)) loadThread()
  })
  const { centrifuge } = useCentrifuge()
  centrifuge.on('publication', onPublication)

  const timer = setInterval(() => {
    if (waiting.value) loadThread()
    if (state.value === 'connecting' || state.value === 'stopped') loadStatus()
  }, Math.min(POLL_MS, STATUS_MS))

  onBeforeUnmount(() => {
    centrifuge.removeListener('publication', onPublication)
    clearInterval(timer)
  })

  watch(
    () => contextId(context.value),
    (id) => {
      thread.value = cache.get(id) ?? null
      error.value = ''
      pending.value = ''
      loadThread()
    },
    { immediate: true }
  )
  loadStatus()

  return {
    status,
    state,
    thread,
    threadLoading,
    sending,
    pending,
    error,
    waiting,
    recent,
    send,
    retry,
    loadRecent,
    loadStatus,
    reload: loadThread
  }
}
