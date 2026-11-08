import { reactive, ref } from 'vue'
import type { XdebugTraceNode, XdebugTraceTreePage } from '../types'

// Key of the top level in the per-parent state.
export const ROOT = -1

export type TreeQuery = { parent?: number, from?: number }
export type LoadTreePage = (query: TreeQuery) => Promise<XdebugTraceTreePage>

type Level = {
  nodes: XdebugTraceNode[]
  next: number | null
  loading: boolean
  error: string
  loaded: boolean
}

const emptyLevel = (): Level => ({ nodes: [], next: null, loading: false, error: '', loaded: false })

// The call tree of one trace, loaded one level at a time (the server answers
// one level per request). Owns: callees per parent offset, which calls are
// open, and the search hit to show.
export const useTraceTree = (load: LoadTreePage) => {
  const levels = reactive(new Map<number, Level>())
  const expanded = reactive(new Set<number>())
  const highlighted = ref<number | null>(null)

  const level = (key: number): Level => {
    if (!levels.has(key)) levels.set(key, emptyLevel())
    return levels.get(key) as Level
  }

  const fetchInto = async (key: number, query: TreeQuery, append: boolean) => {
    const state = level(key)
    if (state.loading) return
    state.loading = true
    state.error = ''
    try {
      const answer = await load(query)
      state.nodes = append ? [...state.nodes, ...answer.nodes] : answer.nodes
      state.next = answer.next ?? null
      state.loaded = true
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e)
    } finally {
      state.loading = false
    }
  }

  const loadLevel = async (key: number) => {
    if (level(key).loaded) return
    await fetchInto(key, key === ROOT ? {} : { parent: key }, false)
  }

  const loadRoot = () => loadLevel(ROOT)

  const loadMore = async (key: number) => {
    const next = level(key).next
    if (next === null) return
    // The server continues the same list: callees of a call keep parent=.
    await fetchInto(key, key === ROOT ? { from: next } : { parent: key, from: next }, true)
  }

  // After an error: the first page again, or the page after the loaded ones.
  const retry = async (key: number) => {
    if (level(key).loaded) await loadMore(key)
    else await loadLevel(key)
  }

  const open = async (offset: number) => {
    expanded.add(offset)
    await loadLevel(offset)
  }

  const toggle = async (node: XdebugTraceNode) => {
    if (expanded.has(node.offset)) {
      expanded.delete(node.offset)
      return
    }
    if (node.children > 0) await open(node.offset)
  }

  // Opens every ancestor of a search hit, top level first, and marks the hit.
  const reveal = async (hit: XdebugTraceNode) => {
    await loadRoot()
    const path = hit.path ?? []
    for (const step of path) {
      await open(step.offset)
    }
    // The hit may sit past the first page of its caller's callees.
    const key = path.length ? path[path.length - 1].offset : ROOT
    const has = () => level(key).nodes.some((n) => n.offset === hit.offset)
    while (!has() && level(key).next !== null && !level(key).error) {
      await loadMore(key)
    }
    highlighted.value = hit.offset
  }

  return {
    highlighted,
    loadRoot,
    loadMore,
    retry,
    toggle,
    reveal,
    childrenOf: (key: number) => levels.get(key)?.nodes ?? [],
    isExpanded: (offset: number) => expanded.has(offset),
    isLoading: (key: number) => levels.get(key)?.loading ?? false,
    isLoaded: (key: number) => levels.get(key)?.loaded ?? false,
    hasMore: (key: number) => (levels.get(key)?.next ?? null) !== null,
    errorOf: (key: number) => levels.get(key)?.error ?? '',
  }
}

export type TraceTreeState = ReturnType<typeof useTraceTree>
