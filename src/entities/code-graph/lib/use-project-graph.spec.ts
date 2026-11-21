import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CodeGraph } from '../types'
import { forgetProjectGraphs, useProjectGraph } from './use-project-graph'

const api = { getGraph: vi.fn() }

vi.mock('./use-code-graph-requests', () => ({ useCodeGraphRequests: () => api }))

const whole: CodeGraph = {
  nodes: [
    { id: 'ns:App\\Http', kind: 'namespace', name: 'Http', fqn: 'App\\Http', depth: 0, size: 2 },
    { id: 'ns:App\\Service', kind: 'namespace', name: 'Service', fqn: 'App\\Service', depth: 0, size: 4 }
  ],
  edges: [{ from: 'ns:App\\Http', to: 'ns:App\\Service', kind: 'calls', confidence: 'exact', count: 3 }],
  truncated: false
}

const opened: CodeGraph = {
  nodes: [
    whole.nodes[0],
    { id: 's:10', kind: 'class', name: 'Checkout', fqn: 'App\\Service\\Checkout', depth: 0, size: 2, symbol_id: 10, group: 'ns:App\\Service' }
  ],
  edges: [],
  truncated: false
}

const classOpened: CodeGraph = {
  nodes: [
    whole.nodes[0],
    { id: 's:11', kind: 'method', name: 'run', fqn: 'App\\Service\\Checkout::run', depth: 0, symbol_id: 11, group: 's:10' }
  ],
  edges: [],
  truncated: false
}

describe('useProjectGraph', () => {
  beforeEach(() => {
    api.getGraph.mockReset()
    forgetProjectGraphs()
  })

  it('loads the whole root folded, calls only', async () => {
    api.getGraph.mockResolvedValue(whole)
    const p = useProjectGraph(ref('shop'))
    await flushPromises()
    expect(api.getGraph).toHaveBeenCalledWith('shop', { kinds: 'calls,instantiates', limit: 300, expand: [], confidence: 'all' })
    expect(p.state.value).toBe('ready')
    expect(p.layout.value?.nodes).toHaveLength(2)
  })

  it('opens a box, then a class inside it, and closing the outer closes both', async () => {
    api.getGraph.mockResolvedValueOnce(whole).mockResolvedValueOnce(opened).mockResolvedValueOnce(classOpened)
    const p = useProjectGraph(ref('shop'))
    await flushPromises()

    p.expand('ns:App\\Service')
    await flushPromises()
    expect(api.getGraph).toHaveBeenLastCalledWith('shop', expect.objectContaining({ expand: ['ns:App\\Service'] }))
    expect(p.layout.value?.groups.map((g) => g.id)).toEqual(['ns:App\\Service'])

    p.expand('s:10')
    await flushPromises()
    expect(api.getGraph).toHaveBeenLastCalledWith('shop', expect.objectContaining({ expand: ['ns:App\\Service', 's:10'] }))
    // The class frame sits in the namespace frame it came from.
    expect(p.layout.value?.groups.map((g) => [g.id, g.depth])).toEqual([
      ['ns:App\\Service', 0],
      ['s:10', 1]
    ])

    api.getGraph.mockResolvedValueOnce(whole)
    p.collapse('ns:App\\Service')
    await flushPromises()
    expect(p.expanded.value).toEqual([])
    expect(api.getGraph).toHaveBeenLastCalledWith('shop', expect.objectContaining({ expand: [] }))
  })

  it('starts folded again on another root and drops a late answer for the old one', async () => {
    let late: (g: CodeGraph) => void = () => {}
    api.getGraph.mockResolvedValueOnce(whole).mockReturnValueOnce(new Promise((r) => (late = r)))
    const root = ref('shop')
    const p = useProjectGraph(root)
    await flushPromises()
    p.expand('ns:App\\Service')

    api.getGraph.mockResolvedValueOnce({ nodes: [], edges: [], truncated: false })
    root.value = 'other'
    await flushPromises()
    late(opened)
    await flushPromises()
    expect(p.expanded.value).toEqual([])
    expect(p.layout.value?.nodes).toHaveLength(0)
  })

  it('comes back with what was open for the root', async () => {
    api.getGraph.mockResolvedValue(opened)
    const first = useProjectGraph(ref('shop'))
    await flushPromises()
    first.expand('ns:App\\Service')
    await flushPromises()

    const again = useProjectGraph(ref('shop'))
    await flushPromises()
    expect(again.expanded.value).toEqual(['ns:App\\Service'])
    expect(api.getGraph).toHaveBeenLastCalledWith('shop', expect.objectContaining({ expand: ['ns:App\\Service'] }))
  })

  it('reports a failed load', async () => {
    api.getGraph.mockRejectedValueOnce(new Error('boom'))
    const p = useProjectGraph(ref('shop'))
    await flushPromises()
    expect(p.state.value).toBe('error')
    expect(p.error.value).toBe('boom')
  })
})
