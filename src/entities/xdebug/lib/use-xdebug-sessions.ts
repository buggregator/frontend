import { computed, ref } from 'vue'
import type { XdebugConfig, XdebugDriving, XdebugSession, XdebugSettings, XdebugWsMessage } from '../types'
import type { XdebugRequests } from './use-xdebug-requests'
import { isLive } from './xdebug-format'

export type LoadState = 'loading' | 'ready' | 'error'

// The server keeps a closed session for ten minutes; the page hides it after
// the same time without asking again.
export const TOMBSTONE_TTL_MS = 10 * 60 * 1000

const DRIVING_KEYS = ['driver', 'last_continuation_by', 'last_continuation_agent', 'idle_deadline'] as const

// The driving fields a status event carries; a field it lacks (older server) keeps its value.
const driving = (data: XdebugDriving): XdebugDriving =>
  Object.fromEntries(DRIVING_KEYS.filter((k) => k in data).map((k) => [k, data[k]]))

// Module config and the session list: loaded once, then kept live from the
// `xdebug` channel (`apply`).
export const useXdebugSessions = (api: Pick<XdebugRequests, 'getConfig' | 'getSessions' | 'dismissSession'>) => {
  const config = ref<XdebugConfig | null>(null)
  const all = ref<XdebugSession[]>([])
  const state = ref<LoadState>('loading')
  const now = ref(Date.now())

  const load = async () => {
    state.value = 'loading'
    try {
      config.value = await api.getConfig()
      all.value = config.value.enabled ? await api.getSessions() : []
      state.value = 'ready'
    } catch {
      state.value = 'error'
    }
  }

  const upsert = (session: XdebugSession) => {
    const i = all.value.findIndex((s) => s.id === session.id)
    if (i === -1) all.value = [...all.value, session]
    else all.value = all.value.map((s) => (s.id === session.id ? { ...s, ...session } : s))
  }

  const patch = (id: string, changes: Partial<XdebugSession>) => {
    all.value = all.value.map((s) => (s.id === id ? { ...s, ...changes } : s))
  }

  const apply = (message: XdebugWsMessage) => {
    switch (message.event) {
      case 'session.created':
        upsert(message.data)
        break
      case 'session.status': {
        const { id, state: next, file, line, kind, target } = message.data
        const before = all.value.find((s) => s.id === id)
        if (!before) {
          upsert({ id, state: next, ide_connected: true, agent_calls: 0 })
        }
        patch(id, {
          state: next,
          ...(file ? { last_file: file } : {}),
          ...(line ? { last_line: line } : {}),
          ...(kind ? { kind } : {}),
          ...(target ? { target } : {}),
          ...driving(message.data),
          ...(next === 'break' && before?.state !== 'break' ? { paused_at: new Date().toISOString() } : {})
        })
        break
      }
      case 'session.closed':
        patch(message.data.id, {
          state: message.data.state,
          closed_reason: message.data.reason,
          closed_at: new Date().toISOString(),
          idle_deadline: null,
          ...(message.data.reason === 'ide_unreachable' || message.data.reason === 'ide_closed' ? { ide_connected: false } : {})
        })
        break
      case 'session.idle':
        patch(message.data.id, { idle_deadline: message.data.idle_deadline })
        break
      case 'agent.call': {
        const s = all.value.find((x) => x.id === message.data.session_id)
        if (s) patch(s.id, { agent_calls: s.agent_calls + 1 })
        break
      }
      default:
        break
    }
  }

  const dismiss = async (id: string) => {
    await api.dismissSession(id)
    all.value = all.value.filter((s) => s.id !== id)
  }

  // After PUT /api/xdebug/settings: the page shows the saved values at once.
  const setSettings = (settings: XdebugSettings) => {
    if (config.value) config.value = { ...config.value, ...settings }
  }

  const tick = () => {
    now.value = Date.now()
  }

  // Live sessions first (newest on top), then tombstones younger than the TTL.
  const sessions = computed(() => {
    const fresh = all.value.filter(
      (s) => isLive(s) || !s.closed_at || now.value - Date.parse(s.closed_at) < TOMBSTONE_TTL_MS
    )
    const byStart = (a: XdebugSession, b: XdebugSession) =>
      (b.started_at ?? '').localeCompare(a.started_at ?? '') || Number(b.id) - Number(a.id)
    return [...fresh.filter(isLive).sort(byStart), ...fresh.filter((s) => !isLive(s)).sort(byStart)]
  })

  return { config, sessions, state, load, apply, upsert, setSettings, dismiss, tick }
}
