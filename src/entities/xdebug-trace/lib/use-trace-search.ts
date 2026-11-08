import { ref } from 'vue'
import type { XdebugTraceNode, XdebugTraceTreePage } from '../types'

export type SearchTrace = (q: string, from?: number) => Promise<XdebugTraceTreePage>

// Calls whose function or file matches a query, one page at a time. The
// server scans the whole trace per request, so a search runs on submit only.
export const useTraceSearch = (search: SearchTrace) => {
  const query = ref('')
  const hits = ref<XdebugTraceNode[]>([])
  const next = ref<number | null>(null)
  const loading = ref(false)
  const error = ref('')
  const searched = ref('') // the query the hits belong to; empty before any search

  // A newer search wins over an older answer that arrives late.
  let generation = 0

  const fetchPage = async (q: string, from: number | undefined, append: boolean) => {
    const mine = ++generation
    loading.value = true
    error.value = ''
    try {
      const answer = await search(q, from)
      if (mine !== generation) return
      hits.value = append ? [...hits.value, ...answer.nodes] : answer.nodes
      next.value = answer.next ?? null
      searched.value = q
    } catch (e) {
      if (mine !== generation) return
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === generation) loading.value = false
    }
  }

  const run = async () => {
    const q = query.value.trim()
    if (!q) {
      clear()
      return
    }
    hits.value = []
    next.value = null
    await fetchPage(q, undefined, false)
  }

  const more = async () => {
    if (next.value === null || !searched.value) return
    await fetchPage(searched.value, next.value, true)
  }

  const clear = () => {
    generation++
    query.value = ''
    hits.value = []
    next.value = null
    loading.value = false
    error.value = ''
    searched.value = ''
  }

  return { query, hits, next, loading, error, searched, run, more, clear }
}

export type TraceSearchState = ReturnType<typeof useTraceSearch>
