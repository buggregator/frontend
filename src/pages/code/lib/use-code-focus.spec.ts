import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CodeGraph } from '@/entities/code-graph'
import { useCodeFocus, type FocusTarget } from './use-code-focus'

const api = {
  getSymbol: vi.fn(),
  search: vi.fn(),
  resolve: vi.fn(),
  getCallers: vi.fn(),
  getCallees: vi.fn()
}

vi.mock('@/entities/code-graph', async (orig) => ({
  ...(await orig<typeof import('@/entities/code-graph')>()),
  useCodeGraphRequests: () => api
}))

const detail = (id: number, extra = {}) => ({
  id,
  root: 'shop',
  kind: 'method',
  name: `m${id}`,
  fqn: `App\\S::m${id}`,
  file: 'S.php',
  line_start: 1,
  line_end: 9,
  members: [],
  relations: [],
  incoming: [],
  callers: 1,
  callees: 1,
  ...extra
})
const g = (focus: number, other: number, side: 'in' | 'out'): CodeGraph => ({
  nodes: [
    { id: `s:${focus}`, symbol_id: focus, kind: 'method', name: 'f', fqn: 'f', depth: 0 },
    { id: `s:${other}`, symbol_id: other, kind: 'method', name: 'o', fqn: 'o', depth: 1 }
  ],
  edges: [side === 'in' ? { from: `s:${other}`, to: `s:${focus}`, kind: 'calls', confidence: 'exact', count: 1 } : { from: `s:${focus}`, to: `s:${other}`, kind: 'calls', confidence: 'exact', count: 1 }],
  truncated: false
})

describe('useCodeFocus', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset())
    api.getSymbol.mockImplementation((id: number) => Promise.resolve(detail(id)))
    api.getCallers.mockResolvedValue(g(1, 2, 'in'))
    api.getCallees.mockResolvedValue(g(1, 3, 'out'))
  })

  it('loads a symbol and both sides', async () => {
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 1 }))
    await flushPromises()
    expect(f.state.value).toBe('ready')
    expect(f.layout.value?.nodes.map((n) => n.id).sort()).toEqual(['s:1', 's:2', 's:3'])
    expect(api.getCallers).toHaveBeenCalledWith(1, 1, 200)
  })

  it('resolves a stack frame by file and line', async () => {
    api.resolve.mockResolvedValue({ id: 1, kind: 'method', name: 'm1', fqn: 'x', root: 'shop', file: 'S.php', line_start: 1, line_end: 9 })
    const f = useCodeFocus(ref<FocusTarget>({ file: '/var/www/html/S.php', line: 4 }))
    await flushPromises()
    expect(api.resolve).toHaveBeenCalledWith('/var/www/html/S.php', 4, undefined)
    expect(f.focus.value?.id).toBe(1)
  })

  it('finds a symbol by its full name after a re-index', async () => {
    api.search.mockResolvedValue([{ id: 9, fqn: 'App\\S::other' }, { id: 5, fqn: 'App\\S::m5' }])
    const f = useCodeFocus(ref<FocusTarget>({ fqn: 'App\\S::m5' }))
    await flushPromises()
    expect(f.focus.value?.id).toBe(5)
  })

  it('says not found when the frame has no symbol', async () => {
    api.resolve.mockRejectedValue(Object.assign(new Error('no symbol'), { status: 404 }))
    const f = useCodeFocus(ref<FocusTarget>({ file: 'routes/web.php', line: 18 }))
    await flushPromises()
    expect(f.state.value).toBe('not-found')
  })

  it('asks only callers when the direction is callers', async () => {
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 1 }))
    await flushPromises()
    api.getCallees.mockClear()
    f.direction.value = 'callers'
    await flushPromises()
    expect(api.getCallees).not.toHaveBeenCalled()
    expect(f.layout.value?.nodes.map((n) => n.id).sort()).toEqual(['s:1', 's:2'])
  })

  it('reloads with the new depth', async () => {
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 1 }))
    await flushPromises()
    f.depth.value = 3
    await flushPromises()
    expect(api.getCallers).toHaveBeenLastCalledWith(1, 3, 200)
  })

  it('loads the picked node for the side panel', async () => {
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 1 }))
    await flushPromises()
    await f.select('s:3')
    expect(f.selected.value?.id).toBe(3)
  })
  it('falls back to the full name when the id is stale', async () => {
    api.getSymbol.mockImplementation((id: number) =>
      id === 99 ? Promise.reject(Object.assign(new Error('gone'), { status: 404 })) : Promise.resolve(detail(id))
    )
    api.search.mockResolvedValue([{ id: 5, fqn: 'App\\S::m5' }])
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 99, fqn: 'App\\S::m5' }))
    await flushPromises()
    expect(f.state.value).toBe('ready')
    expect(f.focus.value?.id).toBe(5)
  })

  it('keeps the edges of the last depth asked when answers come out of order', async () => {
    const f = useCodeFocus(ref<FocusTarget>({ symbol: 1 }))
    await flushPromises()
    let slow: (g: CodeGraph) => void = () => {}
    api.getCallers.mockImplementationOnce(() => new Promise((r) => (slow = r)))
    f.depth.value = 3
    await flushPromises()
    api.getCallers.mockResolvedValueOnce(g(1, 7, 'in'))
    f.depth.value = 1
    await flushPromises()
    slow(g(1, 8, 'in'))
    await flushPromises()
    expect(f.layout.value?.nodes.map((n) => n.id)).toContain('s:7')
    expect(f.layout.value?.nodes.map((n) => n.id)).not.toContain('s:8')
  })
})
