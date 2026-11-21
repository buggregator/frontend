import { useIntervalFn } from '@vueuse/core'
import { computed, onScopeDispose, ref } from 'vue'
import { useCodeGraphRequests, type CodeGraphRoots } from '@/entities/code-graph'

// The roots for the Code page header: index state, re-asked every 3 s while
// one of them is still indexing.
export const useRootsStatus = () => {
  const api = useCodeGraphRequests()
  const roots = ref<CodeGraphRoots | null>(null)
  const failed = ref(false)

  const busy = computed(() => !!roots.value?.roots.some((r) => r.state === 'indexing' || r.state === 'pending'))

  let disposed = false
  const load = async () => {
    try {
      roots.value = await api.getRoots()
      failed.value = false
    } catch {
      failed.value = true
    }
    if (disposed) return
    if (busy.value) resume()
    else pause()
  }

  const { pause, resume } = useIntervalFn(load, 3000, { immediate: false })
  onScopeDispose(() => {
    disposed = true
    pause()
  })
  load()

  return { roots, failed, busy, reload: load }
}
