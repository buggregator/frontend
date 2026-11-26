import { describe, expect, it } from 'vitest'
import type { ProfilerCallGraph } from '../../types'
import { BACK_EDGE, backEdgePath, mapToVueFlow, SELF_LOOP_EDGE, selfLoopPath } from './map-to-vue-flow'

const node = (id: string, percents: number) => ({
  data: { id, name: id, cost: {}, metrics: { cost: 0, percents }, color: '#fff', textColor: '#000' },
})
const edge = (source: string, target: string) => ({ data: { source, target, label: '10%', color: '#666' } })

const graph = (edges: ProfilerCallGraph['edges']): ProfilerCallGraph => ({
  toolbar: [],
  nodes: [node('main', 100), node('fib', 100), node('log', 100)],
  edges,
})

describe('mapToVueFlow: a function calling itself', () => {
  it('draws a call of a node to itself as a loop, other calls as they were', () => {
    const { edges } = mapToVueFlow(graph([edge('main', 'fib'), edge('fib', 'fib'), edge('fib', 'log')]))

    expect(edges.map((e) => [e.id, e.type])).toEqual([
      ['e-main-fib', undefined],
      ['e-fib-fib', SELF_LOOP_EDGE],
      ['e-fib-log', undefined],
    ])
  })

  it('leaves room beside a looped node without moving it off its place', () => {
    const plain = mapToVueFlow(graph([edge('main', 'fib'), edge('main', 'log')]))
    const looped = mapToVueFlow(graph([edge('main', 'fib'), edge('main', 'log'), edge('fib', 'fib')]))
    const x = (nodes: typeof plain.nodes, id: string) => nodes.find((n) => n.id === id)!.position.x

    // The loop's node and its sibling move apart; the loop takes room on both sides of its node
    const gap = (nodes: typeof plain.nodes) => Math.abs(x(nodes, 'log') - x(nodes, 'fib'))
    expect(gap(looped.nodes) - gap(plain.nodes)).toBeGreaterThanOrEqual(70)
    // The root stays centered over its callees
    const center = (nodes: typeof plain.nodes) => (x(nodes, 'fib') + x(nodes, 'log')) / 2
    expect(x(looped.nodes, 'main')).toBeCloseTo(center(looped.nodes), 0)
  })
})

describe('selfLoopPath', () => {
  it('leaves the right side of the node and comes back lower, with the label inside it', () => {
    expect(selfLoopPath(200, 50)).toEqual({
      path: 'M 200 42 C 270 5, 270 95, 200 58',
      labelX: 228,
      labelY: 50,
    })
  })
})

describe('mapToVueFlow: functions calling each other', () => {
  it('draws the call back up a cycle beside the nodes, the calls down as they were', () => {
    // main calls fib, fib calls log, and log calls fib again
    const { nodes, edges } = mapToVueFlow(graph([edge('main', 'fib'), edge('fib', 'log'), edge('log', 'fib')]))
    const y = (id: string) => nodes.find((n) => n.id === id)!.position.y

    expect(y('fib')).toBeLessThan(y('log'))
    expect(edges.map((e) => [e.id, e.type])).toEqual([
      ['e-main-fib', undefined],
      ['e-fib-log', undefined],
      ['e-log-fib', BACK_EDGE],
    ])
    // Its label is placed on the curve, not shifted off it as the labels of the calls down are
    expect(edges[2].labelStyle).toEqual({ fontSize: '8px', fill: '#999' })
  })
})

describe('backEdgePath', () => {
  it('leaves the top of the lower node off its middle and comes into the right side of the upper one', () => {
    const lower = { x: 0, y: 200, width: 100, height: 40 }
    const upper = { x: 50, y: 0, width: 200, height: 60 }

    expect(backEdgePath(lower, upper)).toEqual({
      path: 'M 80 200 C 80 140, 310 30, 250 30',
      labelX: 187.5,
      labelY: 92.5,
    })
  })
})
