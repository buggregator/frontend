import type { CodeGraphRoots, CodeRootStatus } from '@/entities/code-graph'

// The folder the Code page shows: the one asked for in ?root=, else the
// first indexed one, else the first listed.
export const pickedRoot = (roots: CodeGraphRoots | null, asked: string | null | undefined): CodeRootStatus | null => {
  const all = roots?.roots ?? []
  return (
    (asked ? all.find((r) => r.name === asked) : undefined) ??
    all.find((r) => r.state === 'ready' || (r.symbols ?? 0) > 0) ??
    all[0] ??
    null
  )
}

// Changes when the shown folder finishes (re)indexing: the page then draws it
// again from scratch.
export const rootStamp = (r: CodeRootStatus | null) => (r ? `${r.name}|${r.state}|${r.indexed_at ?? ''}` : '')
