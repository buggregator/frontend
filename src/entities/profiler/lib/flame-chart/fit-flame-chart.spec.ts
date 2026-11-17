import { describe, expect, it } from 'vitest'
import type { ProfileFlameChart } from '../../types'
import { fitFlameChart } from './fit-flame-chart'

type Bar = { name: string; depth: number; start: number; end: number }

const node = (
  name: string,
  start: number,
  duration: number,
  children: ProfileFlameChart[] = []
): ProfileFlameChart => ({
  name,
  start,
  duration,
  children,
  type: 'task',
  color: '#B3E5FC',
  cost: { wt: duration * 1000 }
})

// What the server sends for this xhprof profile (#446):
//   main()==>a 20, main()==>b 80, a==>x 10, b==>z 5, b==>x 70, x==>y 65, z==>w 4
// x is called from a and from b. The server expands x once, under a==>x
// (10 ms wide), but gives it the x==>y child summed over every call of x
// (65 ms). So y is wider than x and a, and covers w at the same depth.
const serverTree = (): ProfileFlameChart[] => [
  node('main()', 0, 100, [
    node('a', 0, 20, [node('x', 0, 10, [node('y', 0, 65)])]),
    node('b', 20, 80, [node('z', 20, 5, [node('w', 20, 4)]), node('x', 25, 70)])
  ])
]

const bars = (nodes: ProfileFlameChart[], depth = 0): Bar[] =>
  nodes.flatMap((n) => [
    { name: n.name, depth, start: n.start, end: n.start + n.duration },
    ...bars(n.children, depth + 1)
  ])

const overlaps = (nodes: ProfileFlameChart[]): string[] => {
  const all = bars(nodes)
  return all.flatMap((a, i) =>
    all
      .slice(i + 1)
      .filter((b) => b.depth === a.depth && a.start < b.end && b.start < a.end)
      .map((b) => `${a.name}[${a.start},${a.end}] x ${b.name}[${b.start},${b.end}]`)
  )
}

const outsideParent = (nodes: ProfileFlameChart[]): string[] =>
  nodes.flatMap((p) => [
    ...p.children
      .filter((c) => c.start < p.start || c.start + c.duration > p.start + p.duration)
      .map((c) => `${c.name} outside ${p.name}`),
    ...outsideParent(p.children)
  ])

describe('fitFlameChart', () => {
  it('server data for #446 really has a child past its parent and overlapping bars', () => {
    expect(outsideParent(serverTree())).toEqual(['y outside x'])
    expect(overlaps(serverTree())).toEqual(['y[0,65] x w[20,24]'])
  })

  it('keeps every child inside its parent', () => {
    expect(outsideParent(fitFlameChart(serverTree()))).toEqual([])
  })

  it('never lets two bars at one depth overlap', () => {
    expect(overlaps(fitFlameChart(serverTree()))).toEqual([])
  })

  it('shrinks children that do not fit, keeping their proportions', () => {
    const tree = [node('p', 0, 10, [node('c1', 0, 30), node('c2', 30, 10)])]

    const [p] = fitFlameChart(tree)

    expect(p.children.map((c) => [c.name, c.start, c.duration])).toEqual([
      ['c1', 0, 7.5],
      ['c2', 7.5, 2.5]
    ])
  })

  it('leaves data that already fits untouched', () => {
    const tree = [node('main()', 0, 10, [node('a', 0, 6, [node('c', 0, 2)]), node('b', 6, 3)])]

    expect(fitFlameChart(tree)).toEqual(tree)
  })

  it('treats a negative value (memory freed) as an empty bar', () => {
    const tree = [node('main()', 0, 10, [node('a', 0, -4), node('b', -4, 5)])]

    const [main] = fitFlameChart(tree)

    expect(main.children.map((c) => [c.name, c.start, c.duration])).toEqual([
      ['a', 0, 0],
      ['b', 0, 5]
    ])
  })

  it('keeps the real cost for the tooltip and does not change the input', () => {
    const tree = serverTree()
    const [main] = fitFlameChart(tree)

    expect(main.children[0].children[0].children[0].cost).toEqual({ wt: 65000 })
    expect(tree[0].children[0].children[0].children[0].duration).toBe(65)
  })
})
