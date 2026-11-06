import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useEventsStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import type { MockRequestEvent } from '../types'
import { useMockRequests } from './use-mock-requests'

export const isMockRequest = (event: ServerEvent<unknown>): event is MockRequestEvent =>
  event.type === 'http-dump' && !!(event.payload as { mock?: unknown } | null)?.mock

export type LoadState = 'loading' | 'ready' | 'error'

// Requests captured under /mock/ for the active project: loaded once from
// `GET /api/mocks/requests`, then kept live from the WebSocket feed (every mock
// request is also an HTTP dump, so it arrives through the events store).
export const useMockTraffic = () => {
  const { getRequests } = useMockRequests()
  const eventsStore = useEventsStore()
  const { activeProjectKey } = storeToRefs(eventsStore)

  const requests = ref<MockRequestEvent[]>([])
  const pending = ref<MockRequestEvent[]>([])
  const freshIds = ref<Set<string>>(new Set())
  const state = ref<LoadState>('loading')
  const paused = ref(false)
  const known = new Set<string>()

  const add = (incoming: MockRequestEvent[]) => {
    const fresh = incoming.filter((e) => e.project === activeProjectKey.value && !known.has(e.uuid))
    if (!fresh.length) return

    fresh.forEach((e) => known.add(e.uuid))
    if (paused.value) {
      pending.value = [...fresh, ...pending.value]
    } else {
      requests.value = [...fresh, ...requests.value]
      freshIds.value = new Set([...freshIds.value, ...fresh.map((e) => e.uuid)])
    }
  }

  const load = async () => {
    state.value = 'loading'
    known.clear()
    pending.value = []
    try {
      const list = await getRequests()
      list.forEach((e) => known.add(e.uuid))
      requests.value = list
      state.value = 'ready'
    } catch {
      state.value = 'error'
    }
  }

  eventsStore.$onAction(({ name, args, after }) => {
    if (name !== 'addList') return
    const list = (args[0] as ServerEvent<unknown>[]).filter(isMockRequest)
    after(() => add(list))
  })

  watch(activeProjectKey, () => load())

  const setPaused = (value: boolean) => {
    paused.value = value
    if (!value) showPending()
  }

  const showPending = () => {
    requests.value = [...pending.value, ...requests.value]
    pending.value = []
  }

  const forget = (uuids: string[]) => {
    const drop = new Set(uuids)
    requests.value = requests.value.filter((e) => !drop.has(e.uuid))
  }

  const noMatchCount = computed(() => requests.value.filter((e) => !e.payload.mock.matched).length)

  const hitsByRule = computed(() => {
    const hits = new Map<string, number>()
    requests.value.forEach(({ payload: { mock } }) => {
      if (mock.rule_id) hits.set(mock.rule_id, (hits.get(mock.rule_id) ?? 0) + 1)
    })
    return hits
  })

  return { requests, pending, freshIds, state, paused, noMatchCount, hitsByRule, load, setPaused, showPending, forget }
}
