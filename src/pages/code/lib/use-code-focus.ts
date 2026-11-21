import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import {
  layoutFocusGraph,
  useCodeGraphRequests,
  type CodeGraph,
  type CodeSymbol,
  type CodeSymbolDetail
} from '@/entities/code-graph'

export type FocusDirection = 'callers' | 'both' | 'callees'

// What the URL asks to show: a symbol id, a full name, or a file and line
// (a stack frame) that the server resolves to the innermost symbol.
export type FocusTarget = { symbol?: number; fqn?: string; file?: string; line?: number; root?: string }

type State = 'idle' | 'loading' | 'ready' | 'not-found' | 'error'

const LIMIT = 200

// The Code page state (#6573 A): the symbol in focus, its callers and
// callees `depth` hops away, the node picked for the side panel.
export const useCodeFocus = (target: Ref<FocusTarget>) => {
  const api = useCodeGraphRequests()

  const state = ref<State>('idle')
  const error = ref<string | null>(null)
  const focus = shallowRef<CodeSymbolDetail | null>(null)
  const callers = shallowRef<CodeGraph | null>(null)
  const callees = shallowRef<CodeGraph | null>(null)
  const depth = ref(1)
  const direction = ref<FocusDirection>('both')
  const expanded = ref<number[]>([])
  const selectedId = ref<string | null>(null)
  const selected = shallowRef<CodeSymbolDetail | null>(null)

  const findSymbol = async (t: FocusTarget): Promise<CodeSymbol | null> => {
    if (t.symbol) return api.getSymbol(t.symbol)
    if (t.fqn) {
      const found = await api.search(t.fqn, { root: t.root, limit: 20 })
      return found.find((s) => s.fqn === t.fqn) ?? null
    }
    if (t.file && t.line) return api.resolve(t.file, t.line, t.root)
    return null
  }

  let run = 0
  const loadFocus = async () => {
    const t = target.value
    const mine = ++run
    if (!t.symbol && !t.fqn && !(t.file && t.line)) {
      state.value = 'idle'
      focus.value = null
      return
    }
    state.value = 'loading'
    error.value = null
    try {
      const found = await findSymbol(t)
      if (mine !== run) return
      if (!found) {
        state.value = 'not-found'
        focus.value = null
        return
      }
      const detail = 'members' in found ? (found as CodeSymbolDetail) : await api.getSymbol(found.id)
      if (mine !== run) return
      focus.value = detail
      expanded.value = []
      selectedId.value = null
      selected.value = null
      await loadEdges()
    } catch (e) {
      if (mine !== run) return
      const status = (e as { status?: number }).status
      state.value = status === 404 ? 'not-found' : 'error'
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  const loadEdges = async () => {
    const f = focus.value
    if (!f) return
    const mine = run
    state.value = 'loading'
    try {
      const [inn, out] = await Promise.all([
        direction.value !== 'callees' ? api.getCallers(f.id, depth.value, LIMIT) : Promise.resolve(null),
        direction.value !== 'callers' ? api.getCallees(f.id, depth.value, LIMIT) : Promise.resolve(null)
      ])
      if (mine !== run) return
      callers.value = inn
      callees.value = out
      state.value = 'ready'
    } catch (e) {
      if (mine !== run) return
      state.value = 'error'
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  watch(target, loadFocus, { immediate: true, deep: true })
  watch([depth, direction], () => {
    expanded.value = []
    loadEdges()
  })

  const focusId = computed(() => (focus.value ? `s:${focus.value.id}` : null))

  const layout = computed(() =>
    focusId.value
      ? layoutFocusGraph({
          focus: focusId.value,
          callers: callers.value,
          callees: callees.value,
          // Symbol detail counts calls, not distinct symbols: «+N more» comes
          // from the nodes the answer had but the column did not show.
          expanded: expanded.value
        })
      : null
  )

  const expand = (column: number) => {
    if (!expanded.value.includes(column)) expanded.value = [...expanded.value, column]
  }

  // A node picked in the graph or the list: its details for the side panel.
  const select = async (id: string | null) => {
    selectedId.value = id
    selected.value = null
    const node = layout.value?.nodes.find((n) => n.id === id)
    const symbolId = node?.data?.symbol_id
    if (!symbolId) return
    if (focus.value && symbolId === focus.value.id) {
      selected.value = focus.value
      return
    }
    const detail = await api.getSymbol(symbolId).catch(() => null)
    if (selectedId.value === id) selected.value = detail
  }

  return { state, error, focus, focusId, layout, depth, direction, expand, selectedId, selected, select, reload: loadFocus }
}
