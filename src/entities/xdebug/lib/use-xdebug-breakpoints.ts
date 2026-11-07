import { ref } from 'vue'
import type { XdebugBreakpointDraft, XdebugBreakpointPatch, XdebugSavedBreakpoint, XdebugWsMessage } from '../types'
import { XdebugApiError, type XdebugRequests } from './use-xdebug-requests'

type Api = Pick<XdebugRequests, 'listSavedBreakpoints' | 'addBreakpoint' | 'updateBreakpoint' | 'removeBreakpoint'>

export const EVAL_OFF_TEXT = 'Conditions run PHP, so they need xdebug.allow_eval: true.'

const errorText = (e: unknown) => {
  if (e instanceof XdebugApiError && e.code === 'eval_disabled') return EVAL_OFF_TEXT
  return e instanceof Error ? e.message : String(e)
}

// The saved breakpoints (server PR #401): one list for every session
// Buggregator drives. Owns the list, its load state, rows being sent and
// their errors. The server sends a change to the paused session before it
// answers, so `onChanged` (re-read the session's states) runs after each
// change from here; `breakpoints.changed` brings changes from agents.
export const useXdebugBreakpoints = (api: Api, onChanged: () => void = () => {}) => {
  const list = ref<XdebugSavedBreakpoint[]>([])
  const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const busy = ref(new Set<number>())
  const rowError = ref<Record<number, string>>({})
  const adding = ref(false)
  const addError = ref('')

  const upsert = (bp: XdebugSavedBreakpoint) => {
    const at = list.value.findIndex((b) => b.id === bp.id)
    list.value = at < 0 ? [...list.value, bp] : list.value.map((b, i) => (i === at ? bp : b))
  }
  const drop = (id: number) => { list.value = list.value.filter((b) => b.id !== id) }
  const mark = (id: number, on: boolean) => {
    const next = new Set(busy.value)
    if (on) next.add(id)
    else next.delete(id)
    busy.value = next
  }
  const setRowError = (id: number, text: string) => {
    const { [id]: _, ...rest } = rowError.value
    rowError.value = text ? { ...rest, [id]: text } : rest
  }

  const load = async () => {
    if (state.value !== 'ready') state.value = 'loading'
    try {
      list.value = await api.listSavedBreakpoints()
      state.value = 'ready'
    } catch {
      state.value = 'error'
    }
  }

  const apply = (message: XdebugWsMessage) => {
    if (message.event === 'breakpoints.changed') list.value = message.data ?? []
  }

  const add = async (draft: XdebugBreakpointDraft) => {
    adding.value = true
    addError.value = ''
    try {
      upsert(await api.addBreakpoint(draft))
      onChanged()
      return true
    } catch (e) {
      addError.value = errorText(e)
      return false
    } finally {
      adding.value = false
    }
  }

  const change = async (id: number, patch: XdebugBreakpointPatch, before?: XdebugSavedBreakpoint) => {
    mark(id, true)
    setRowError(id, '')
    try {
      upsert(await api.updateBreakpoint(id, patch))
      onChanged()
      return true
    } catch (e) {
      if (before) upsert(before)
      setRowError(id, errorText(e))
      return false
    } finally {
      mark(id, false)
    }
  }

  // The checkbox moves at once; it goes back if the server refuses.
  const setEnabled = (id: number, enabled: boolean) => {
    const before = list.value.find((b) => b.id === id)
    if (before) upsert({ ...before, enabled })
    return change(id, { enabled }, before)
  }

  // An empty condition removes it.
  const setCondition = (id: number, condition: string) => change(id, { condition: condition.trim() })

  const remove = async (id: number) => {
    mark(id, true)
    setRowError(id, '')
    try {
      await api.removeBreakpoint(id)
      drop(id)
      onChanged()
    } catch (e) {
      setRowError(id, errorText(e))
    } finally {
      mark(id, false)
    }
  }

  // The gutter: a line with a breakpoint loses it, any other line gets one.
  const toggleLine = async (file: string, line: number) => {
    const there = list.value.find((b) => b.type === 'line' && b.file === file && b.line === line)
    if (there) return remove(there.id)
    await add({ type: 'line', file, line })
  }

  return { list, state, busy, rowError, adding, addError, load, apply, add, setEnabled, setCondition, remove, toggleLine }
}

export type XdebugBreakpointsStore = ReturnType<typeof useXdebugBreakpoints>
