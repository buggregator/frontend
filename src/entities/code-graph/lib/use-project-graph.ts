import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import type { CodeGraph } from '../types'
import { DIR_PREFIX, foldFolders } from './fold-folders'
import { projectLayout, type ProjectGroupInfo } from './project-layout'
import { useCodeGraphRequests } from './use-code-graph-requests'

// The whole graph of a root and which boxes are open (#6577 «whole»). Not in
// `lib/index.ts`: it pulls dagre, which loads with the graph only.

export const PROJECT_KINDS = 'calls,instantiates'
export const PROJECT_LIMIT = 300

export type ProjectGraphState = 'idle' | 'loading' | 'ready' | 'error'

// What was open per root, kept while the app runs: back from the focus view
// shows the graph as it was left.
type OpenState = { expanded: string[]; openDirs: Set<string>; groupInfo: Map<string, ProjectGroupInfo> }
const remembered = new Map<string, OpenState>()
export const forgetProjectGraphs = () => remembered.clear()

export const useProjectGraph = (root: Ref<string | null | undefined>) => {
  const api = useCodeGraphRequests()
  const graph = shallowRef<CodeGraph | null>(null)
  // Server side: ns:/s: ids drawn as what they hold.
  const expanded = ref<string[]>([])
  // Client side: folders of packages drawn open (fold-folders).
  const openDirs = ref(new Set<string>())
  const groupInfo = shallowRef(new Map<string, ProjectGroupInfo>())
  // The box opened last: the view moves to its frame.
  const lastOpened = ref<string | null>(null)
  const state = ref<ProjectGraphState>('idle')
  const error = ref<string | null>(null)

  let seq = 0
  const load = async () => {
    const name = root.value
    const mine = ++seq
    if (!name) {
      graph.value = null
      state.value = 'idle'
      return
    }
    state.value = 'loading'
    try {
      const g = await api.getGraph(name, { kinds: PROJECT_KINDS, limit: PROJECT_LIMIT, expand: expanded.value })
      if (mine !== seq) return
      graph.value = g
      error.value = null
      state.value = 'ready'
    } catch (e) {
      if (mine !== seq) return
      error.value = e instanceof Error ? e.message : String(e)
      state.value = 'error'
    }
  }

  // Kept right when something opens or closes (a watcher would run after a
  // root switch and file it under the new root).
  const save = () => {
    if (root.value) {
      remembered.set(root.value, { expanded: [...expanded.value], openDirs: new Set(openDirs.value), groupInfo: groupInfo.value })
    }
  }

  const folded = computed(() => (graph.value ? foldFolders(graph.value, openDirs.value) : null))

  const layout = computed(() => {
    const f = folded.value
    if (!f) return null
    // Folder frames come from the fold; a package frame learns there which
    // folder frame it sits in.
    const info = new Map(groupInfo.value)
    for (const [id, g] of f.groups) info.set(id, info.has(id) ? { ...info.get(id)!, parent: g.parent } : g)
    return projectLayout(f.graph, info)
  })

  const expand = (id: string) => {
    if (id.startsWith(DIR_PREFIX)) {
      lastOpened.value = id
      openDirs.value = new Set(openDirs.value).add(id)
      save()
      return
    }
    if (expanded.value.includes(id)) return
    lastOpened.value = id
    const n = folded.value?.graph.nodes.find((x) => x.id === id)
    if (n) {
      groupInfo.value = new Map(groupInfo.value).set(id, { id, kind: n.kind, name: n.name, fqn: n.fqn, parent: n.group })
    }
    expanded.value = [...expanded.value, id]
    save()
    load()
  }

  // Closing a frame closes everything opened inside it.
  const collapse = (id: string) => {
    lastOpened.value = null
    const gone = new Set([id])
    let grew = true
    while (grew) {
      grew = false
      for (const [gid, info] of groupInfo.value) {
        if (info.parent && gone.has(info.parent) && !gone.has(gid)) {
          gone.add(gid)
          grew = true
        }
      }
    }
    if (id.startsWith(DIR_PREFIX)) {
      const key = id.slice(DIR_PREFIX.length)
      const fqn = folded.value?.groups.get(id)?.fqn ?? key
      const under = (s: string) => s === fqn || s.startsWith(`${fqn}\\`) || s.startsWith(`${fqn}/`)
      openDirs.value = new Set([...openDirs.value].filter((d) => d !== id && !d.startsWith(`${id}/`)))
      for (const [gid, info] of groupInfo.value) if (under(info.fqn)) gone.add(gid)
    }
    const left = expanded.value.filter((x) => !gone.has(x))
    const changed = left.length !== expanded.value.length
    expanded.value = left
    save()
    if (changed) load()
  }

  const collapseAll = () => {
    lastOpened.value = null
    openDirs.value = new Set()
    const had = expanded.value.length > 0
    expanded.value = []
    save()
    if (had) load()
  }

  const anyOpen = computed(() => expanded.value.length > 0 || openDirs.value.size > 0)

  watch(
    root,
    (name) => {
      const kept = name ? remembered.get(name) : undefined
      expanded.value = kept ? [...kept.expanded] : []
      openDirs.value = new Set(kept?.openDirs)
      groupInfo.value = new Map(kept?.groupInfo)
      lastOpened.value = null
      load()
    },
    { immediate: true }
  )

  return { graph, layout, expanded, openDirs, anyOpen, lastOpened, state, error, expand, collapse, collapseAll, reload: load }
}
