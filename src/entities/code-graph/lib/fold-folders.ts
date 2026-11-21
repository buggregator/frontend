import type { CodeGraph, CodeGraphEdge, CodeGraphNode } from '../types'
import type { ProjectGroupInfo } from './project-layout'

// A root with many packages is unreadable as one picture (buggregator: 37
// packages, 113 lines). Above FOLD_ABOVE top-level boxes, packages that
// share a folder are drawn as that folder first (cmd, internal, modules…);
// opening it shows the packages, folded again by the next folder if still
// too many. Client side: the server answers per package.

export const FOLD_ABOVE = 12
export const DIR_PREFIX = 'dir:'

const split = (fqn: string) => fqn.split(/[\\/]/).filter(Boolean)
const sepOf = (fqn: string) => (fqn.includes('\\') ? '\\' : '/')

const commonPrefix = (paths: string[][]) => {
  if (!paths.length) return 0
  let n = 0
  for (;;) {
    const seg = paths[0][n]
    if (seg === undefined || !paths.every((p) => p[n] === seg)) return n
    n++
  }
}

export type FoldedGraph = {
  graph: CodeGraph
  // Frames of open folders, and the folder frame each top-level package sits in.
  groups: Map<string, ProjectGroupInfo>
}

const isTop = (n: CodeGraphNode) => !n.group && (n.kind === 'namespace' || n.kind === 'package')

export const foldFolders = (graph: CodeGraph, open: ReadonlySet<string>, above = FOLD_ABOVE): FoldedGraph => {
  const groups = new Map<string, ProjectGroupInfo>()
  const tops = graph.nodes.filter(isTop)
  if (tops.length <= above) return { graph, groups }

  // Top-level package id → the id it is drawn as (itself or a folder).
  const rep = new Map<string, string>()
  // Top-level package id → the open folder frame it sits in.
  const frameOf = new Map<string, string>()
  const folders = new Map<string, CodeGraphNode>()

  const fold = (members: CodeGraphNode[], parentFrame: string | undefined) => {
    const paths = members.map((n) => split(n.fqn))
    const base = commonPrefix(paths)
    const byKey = new Map<string, CodeGraphNode[]>()
    members.forEach((n, i) => {
      const seg = paths[i][base]
      // The package at the shared folder itself stays a box of its own; App
      // goes with App\\Http and App\\Models.
      const key = seg === undefined ? `=${n.id}` : paths[i].slice(0, base + 1).join('/')
      byKey.set(key, [...(byKey.get(key) ?? []), n])
    })
    for (const [key, list] of byKey) {
      if (key.startsWith('=') || list.length === 1) {
        for (const n of list) {
          rep.set(n.id, n.id)
          if (parentFrame) frameOf.set(n.id, parentFrame)
        }
        continue
      }
      // A folder is named by the whole path its packages share, so one that
      // only leads on (github.com → …/server/v2) is skipped.
      const shared = split(list[0].fqn).slice(0, commonPrefix(list.map((n) => split(n.fqn))))
      const id = `${DIR_PREFIX}${shared.join('/')}`
      const fqn = shared.join(sepOf(list[0].fqn))
      const name = shared[shared.length - 1] ?? key
      if (open.has(id)) {
        groups.set(id, { id, kind: 'folder', name, fqn, parent: parentFrame })
        if (list.length > above) fold(list, id)
        else {
          for (const n of list) {
            rep.set(n.id, n.id)
            frameOf.set(n.id, id)
          }
        }
      } else {
        folders.set(id, {
          id,
          kind: 'folder',
          name,
          fqn,
          depth: 0,
          size: list.reduce((s, n) => s + (n.size ?? 1), 0),
          group: parentFrame
        })
        for (const n of list) rep.set(n.id, id)
      }
    }
  }
  fold(tops, undefined)

  // A node drawn from an opened package keeps its own id; its frame (the
  // package) now sits in the folder frame.
  const nodes: CodeGraphNode[] = []
  for (const n of graph.nodes) {
    const r = rep.get(n.id)
    if (r === undefined) nodes.push(n)
    else if (r === n.id) nodes.push(frameOf.has(n.id) ? { ...n, group: frameOf.get(n.id) } : n)
  }
  nodes.push(...folders.values())
  for (const [pkg, frame] of frameOf) {
    groups.set(pkg, { ...(groups.get(pkg) ?? { id: pkg, kind: 'package', name: pkg, fqn: pkg }), parent: frame })
  }

  // Lines between folded boxes: re-pointed, summed per kind, self lines dropped.
  const to = (id: string) => rep.get(id) ?? id
  const merged = new Map<string, CodeGraphEdge>()
  for (const e of graph.edges) {
    const from = to(e.from)
    const target = to(e.to)
    if (from === target) continue
    const key = `${from}|${target}|${e.kind}`
    const cur = merged.get(key)
    if (cur) {
      cur.count += e.count
      if (e.confidence === 'exact') cur.confidence = 'exact'
    } else merged.set(key, { ...e, from, to: target })
  }

  return { graph: { ...graph, nodes, edges: [...merged.values()] }, groups }
}
