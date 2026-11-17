import type { ProfileFlameChart } from '../../types'

// The server builds the flame chart from xhprof caller==>callee edges, which
// carry no call stacks. A function called from several places is expanded
// once, but its children are summed over every call, so they can be wider than
// the bar they hang under and cover their neighbours (#446). Memory deltas can
// also be negative. Lay the bars out again so that every child stays inside its
// parent and bars at one depth never overlap. `cost` keeps the real numbers.
export const fitFlameChart = (nodes: ProfileFlameChart[]): ProfileFlameChart[] => {
  const start = nodes[0]?.start ?? 0
  return layOut(nodes, start, Number.POSITIVE_INFINITY)
}

const layOut = (nodes: ProfileFlameChart[], start: number, end: number): ProfileFlameChart[] => {
  const durations = nodes.map((n) => Math.max(0, n.duration))
  const total = durations.reduce((sum, d) => sum + d, 0)
  const scale = total > end - start ? (end - start) / total : 1

  let cursor = start
  return nodes.map((n, i) => {
    const duration = Math.min(durations[i] * scale, end - cursor)
    const fitted = {
      ...n,
      start: cursor,
      duration,
      children: layOut(n.children ?? [], cursor, cursor + duration)
    }
    cursor += duration
    return fitted
  })
}
