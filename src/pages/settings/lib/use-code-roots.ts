import { onScopeDispose, ref } from 'vue'
import { type CodeGraphRoots, useCodeGraphRequests } from '@/entities/code-graph'
import { isRootBusy } from './code-roots-format'

// Settings › Code graph: the server's source folders and their index state.
// Polls while a folder waits or is indexed, stops when all are done and when
// the section goes away.
export const useCodeRoots = ({ interval = 2000 } = {}) => {
  const api = useCodeGraphRequests()
  const data = ref<CodeGraphRoots | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  // Folders whose Reindex request is on its way.
  const sending = ref<string[]>([])

  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  const stop = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  const schedule = () => {
    stop()
    if (disposed || !data.value?.roots.some(isRootBusy)) return
    timer = setTimeout(load, interval)
  }

  const load = async () => {
    try {
      data.value = await api.getRoots()
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load the code graph state'
    } finally {
      isLoading.value = false
    }
    schedule()
  }

  const reindex = async (names: string[]) => {
    sending.value = [...sending.value, ...names]
    try {
      const updated = await Promise.all(names.map((name) => api.reindex(name)))
      if (data.value) {
        const byName = new Map(updated.map((r) => [r.name, r]))
        data.value = { ...data.value, roots: data.value.roots.map((r) => byName.get(r.name) ?? r) }
      }
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not start indexing'
    } finally {
      sending.value = sending.value.filter((n) => !names.includes(n))
    }
    schedule()
  }

  onScopeDispose(() => {
    disposed = true
    stop()
  })

  load()

  return {
    data,
    isLoading,
    error,
    sending,
    reload: load,
    reindex: (name: string) => reindex([name]),
    reindexAll: () => reindex(data.value?.roots.map((r) => r.name) ?? [])
  }
}
