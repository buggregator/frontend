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

  // The request running per level: a second load of the same level waits
  // for it instead of returning before its answer is in.
  const inFlight = new Map<number, Promise<void>>()

  const fetchInto = async (key: number, query: TreeQuery, append: boolean) => {
    const running = inFlight.get(key)
    if (running) {
      await running
      return
    }
    const state = level(key)
    const request = (async () => {
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
        inFlight.delete(key)
      }
    })()
    inFlight.set(key, request)
    await request
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

  // Loads pages of a level until it holds the call at offset, or the list
  // ends, fails, or a pass brings nothing new.
  const pageUntil = async (key: number, offset: number) => {
    const state = level(key)
    const has = () => state.nodes.some((n) => n.offset === offset)
    while (!has() && !state.error) {
      const before = state.nodes.length
      if (!state.loaded) await loadLevel(key)
      else if (state.next !== null) await loadMore(key)
      else return
      if (state.nodes.length === before && !inFlight.has(key)) return
    }
  }

  // Opens every ancestor of a search hit, top level first, and marks the hit.
  // Any of them, and the hit itself, may sit past the first page of its caller.
  const reveal = async (hit: XdebugTraceNode) => {
    let parent = ROOT
    for (const step of hit.path ?? []) {
      await pageUntil(parent, step.offset)
      await open(step.offset)
      parent = step.offset
    }
    await pageUntil(parent, hit.offset)
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
