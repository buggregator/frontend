import { storeToRefs } from 'pinia'
import { computed, getCurrentScope, onScopeDispose, ref, shallowRef } from 'vue'
import type { Monolog } from '@/entities/monolog'
import { useEventsStore } from '@/shared/stores'
import { EventTypes, type ServerEvent } from '@/shared/types'

type Options = {
  // Whether a line belongs on screen under the current filters.
  matches: (event: ServerEvent<Monolog>) => boolean
  // New lines of the project to show (all of them; the page keeps those that
  // match and refreshes its counts).
  onLines: (events: ServerEvent<Monolog>[]) => void
}

// Monolog lines arriving over the WebSocket (the events store's `addList`).
// Live, they go straight to the page; paused, they wait in a buffer the page
// sums up as «14 new lines while paused (2 match)» until shown.
export const useLogsStream = ({ matches, onLines }: Options) => {
  const eventsStore = useEventsStore()
  const { activeProjectKey } = storeToRefs(eventsStore)

  const paused = ref(false)
  const buffer = shallowRef<ServerEvent<Monolog>[]>([])

  const bufferedCount = computed(() => buffer.value.length)
  const bufferedMatchCount = computed(() => buffer.value.filter((e) => matches(e)).length)

  const receive = (events: ServerEvent<unknown>[]) => {
    const project = activeProjectKey.value
    const lines = events.filter(
      (e): e is ServerEvent<Monolog> =>
        e.type === EventTypes.Monolog && (!project || !e.project || e.project === project)
    )
    if (!lines.length) return
    if (paused.value) {
      const known = new Set(buffer.value.map((e) => e.uuid))
      buffer.value = [...lines.filter((e) => !known.has(e.uuid)).reverse(), ...buffer.value]
    } else {
      onLines(lines)
    }
  }

  const stop = eventsStore.$onAction(({ name, args, after }) => {
    if (name !== 'addList') return
    const events = args[0] as ServerEvent<unknown>[]
    after(() => receive(events))
  })
  if (getCurrentScope()) onScopeDispose(stop)

  // Resume: what waited goes on screen first.
  const showBuffered = () => {
    const waiting = buffer.value
    buffer.value = []
    paused.value = false
    if (waiting.length) onLines([...waiting].reverse())
  }

  const setPaused = (value: boolean) => (value ? (paused.value = true) : showBuffered())

  // A new list replaces the screen (filters, project): the buffer goes too.
  const clearBuffer = () => (buffer.value = [])

  return {
    paused,
    buffer,
    bufferedCount,
    bufferedMatchCount,
    setPaused,
    showBuffered,
    clearBuffer,
    stop
  }
}
