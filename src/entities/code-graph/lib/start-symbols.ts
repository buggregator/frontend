import type { CodeGraph, CodeGraphNode } from '../types'

// «Start here» on the Code page: the functions and methods of a root with the
// most links, from a whole-root graph the server cut to its busiest nodes.
// Tests and code outside the index are left out.

export type StartSymbol = { node: CodeGraphNode; links: number; entry: boolean }

const CALLABLE = new Set(['function', 'method'])

const isTest = (n: CodeGraphNode) =>
  /(_test\.go|Test\.php|\/tests?\/)/i.test(n.file ?? '') || /^Test[A-Z_]/.test(n.name)

// Entry points read as such by their names: main, controllers, HTTP handlers, commands.
export const isEntryPoint = (n: CodeGraphNode) =>
  n.name === 'main' ||
  /Controller(::|\.)/.test(n.fqn) ||
  /(::|\.)(__invoke|handle|ServeHTTP|Handle)$/.test(n.fqn) ||
  /Command(::|\.)/.test(n.fqn)

export const startSymbols = (graph: CodeGraph | null, limit = 8): StartSymbol[] => {
  if (!graph) return []
  const links = new Map<string, number>()
  for (const e of graph.edges) {
    if (e.kind !== 'calls' && e.kind !== 'instantiates') continue
    links.set(e.from, (links.get(e.from) ?? 0) + e.count)
    links.set(e.to, (links.get(e.to) ?? 0) + e.count)
  }
  return graph.nodes
    .filter((n) => CALLABLE.has(n.kind) && !n.external && n.symbol_id && !isTest(n))
    .map((node) => ({ node, links: links.get(node.id) ?? 0, entry: isEntryPoint(node) }))
    .sort((a, b) => Number(b.entry) - Number(a.entry) || b.links - a.links || a.node.fqn.localeCompare(b.node.fqn))
    .slice(0, limit)
}
