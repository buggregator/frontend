import { ref, shallowRef, watch, type Ref } from 'vue'
import type { CodeFileEntry, CodeOutlineItem } from '../types'
import { useCodeGraphRequests } from './use-code-graph-requests'

// The browsable tree of a root (folder → file → class → function): children
// load when a row opens, once per root.

export type TreeRow =
  | { key: string; type: 'dir' | 'file'; entry: CodeFileEntry; depth: number }
  | { key: string; type: 'symbol'; symbol: CodeOutlineItem; depth: number }

const CALLABLE_OR_TYPE = new Set(['class', 'interface', 'trait', 'enum', 'struct', 'type', 'function', 'method'])

export const useCodeTree = (root: Ref<string | null | undefined>) => {
  const api = useCodeGraphRequests()
  const dirs = shallowRef(new Map<string, CodeFileEntry[]>())
  const outlines = shallowRef(new Map<string, CodeOutlineItem[]>())
  const open = ref(new Set<string>())
  const loading = ref(new Set<string>())
  const failed = ref<string | null>(null)

  const setLoading = (key: string, on: boolean) => {
    const next = new Set(loading.value)
    if (on) next.add(key)
    else next.delete(key)
    loading.value = next
  }

  const loadDir = async (path: string) => {
    const name = root.value
    if (!name || dirs.value.has(path)) return
    setLoading(`d:${path}`, true)
    try {
      const entries = await api.getFiles(name, path)
      if (root.value !== name) return
      dirs.value = new Map(dirs.value).set(path, entries)
      failed.value = null
    } catch (e) {
      if (root.value === name) failed.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (root.value === name) setLoading(`d:${path}`, false)
    }
  }

  const loadFile = async (path: string) => {
    const name = root.value
    if (!name || outlines.value.has(path)) return
    setLoading(`f:${path}`, true)
    try {
      // Namespaces and packages only wrap the file: their members are the rows.
      const items = (await api.getOutline(name, path)).flatMap((s) =>
        s.kind === 'namespace' || s.kind === 'package' ? s.members : [s]
      )
      if (root.value !== name) return
      outlines.value = new Map(outlines.value).set(path, items.filter((s) => CALLABLE_OR_TYPE.has(s.kind)))
    } catch (e) {
      if (root.value === name) failed.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (root.value === name) setLoading(`f:${path}`, false)
    }
  }

  const toggle = (key: string) => {
    const next = new Set(open.value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
      if (key.startsWith('d:')) loadDir(key.slice(2))
      else if (key.startsWith('f:')) loadFile(key.slice(2))
    }
    open.value = next
  }

  // The open rows in order, for one flat, keyboard-friendly list.
  const rows = (): TreeRow[] => {
    const out: TreeRow[] = []
    const symbols = (items: CodeOutlineItem[], depth: number, parent: string) => {
      for (const s of items) {
        const key = `s:${parent}:${s.id}`
        out.push({ key, type: 'symbol', symbol: s, depth })
        const members = s.members?.filter((m) => CALLABLE_OR_TYPE.has(m.kind)) ?? []
        if (members.length && open.value.has(key)) symbols(members, depth + 1, parent)
      }
    }
    const walk = (path: string, depth: number) => {
      for (const entry of dirs.value.get(path) ?? []) {
        if (!entry.dir && !entry.symbols) continue
        const key = `${entry.dir ? 'd' : 'f'}:${entry.path}`
        out.push({ key, type: entry.dir ? 'dir' : 'file', entry, depth })
        if (!open.value.has(key)) continue
        if (entry.dir) walk(entry.path, depth + 1)
        else symbols(outlines.value.get(entry.path) ?? [], depth + 1, entry.path)
      }
    }
    walk('', 0)
    return out
  }

  const reset = () => {
    dirs.value = new Map()
    outlines.value = new Map()
    open.value = new Set()
    loading.value = new Set()
    failed.value = null
    loadDir('')
  }
  watch(root, reset, { immediate: true })

  return { rows, toggle, open, loading, failed, dirs, outlines, reload: reset }
}
