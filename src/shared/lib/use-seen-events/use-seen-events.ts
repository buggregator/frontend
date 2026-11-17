import { storeToRefs } from 'pinia'
import { computed, ref, watch, type Ref } from 'vue'
import { useEventsStore } from '../../stores'
import { type EventType, LocalStorageKeys } from '../../types'

// project key -> event type -> the newest event timestamp the person has seen.
// Server timestamps on both sides, so the browser's clock does not matter.
type SeenMap = Record<string, Record<string, number>>

const read = (): SeenMap => {
  try {
    const parsed = JSON.parse(window?.localStorage?.getItem(LocalStorageKeys.SeenEvents) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const write = (seen: SeenMap) => {
  try {
    window?.localStorage?.setItem(LocalStorageKeys.SeenEvents, JSON.stringify(seen))
  } catch {
    // Storage full or blocked: the counts reset on reload, nothing breaks.
  }
}

// «N new» per event type: events of the active project that arrived after the
// person last looked at that type. `viewing` is what is on screen now (one
// type on its page, every type on «All events»): those stay at zero.
//
// The first visit to a project counts nothing as new: what is already stored
// was there before. A type with no events yet counts from zero, so its first
// events are new.
export const useSeenEvents = (viewing: Ref<EventType[]>) => {
  const { events, activeProjectKey, listState } = storeToRefs(useEventsStore())
  const seen = ref<SeenMap>(read())
  const project = computed(() => activeProjectKey.value ?? '')

  const newestByType = computed(() => {
    const newest = new Map<string, number>()
    for (const event of events.value) {
      const ts = event.timestamp || 0
      if (ts > (newest.get(event.type) ?? 0)) newest.set(event.type, ts)
    }
    return newest
  })

  const newCounts = computed(() => {
    const counts = new Map<string, number>()
    const since = seen.value[project.value]
    if (!since) return counts
    for (const event of events.value) {
      if (event.timestamp && event.timestamp > (since[event.type] ?? 0)) {
        counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
      }
    }
    return counts
  })

  const markSeen = (types: string[]) => {
    const record = { ...(seen.value[project.value] ?? {}) }
    let changed = !seen.value[project.value]
    for (const type of types) {
      const newest = newestByType.value.get(type) ?? 0
      if (newest > (record[type] ?? 0)) {
        record[type] = newest
        changed = true
      }
    }
    if (!changed) return
    seen.value = { ...read(), [project.value]: record }
    write(seen.value)
  }

  // First visit to this project, once its feed has loaded: all of it is seen.
  watch(
    [listState, project],
    ([state, key]) => {
      if (state === 'ready' && key && !seen.value[key]) markSeen([...newestByType.value.keys()])
    },
    { immediate: true }
  )

  // What is on screen is seen, also as new events of it arrive.
  watch(
    [viewing, newestByType],
    () => {
      if (project.value && seen.value[project.value] && viewing.value.length) markSeen(viewing.value)
    },
    { immediate: true }
  )

  const newCount = (type: EventType) => newCounts.value.get(type) ?? 0

  return { newCount }
}
