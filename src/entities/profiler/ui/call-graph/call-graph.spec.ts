import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import callGraphMock from '../../mocks/profiler-callgraph.json'
import CallGraph from './call-graph.vue'

const getCallGraph = vi.fn()

vi.mock('../../lib', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useProfiler: () => ({ getCallGraph }),
}))
vi.mock('../render-graph', () => ({
  RenderGraph: defineComponent({
    props: { height: { type: Number, required: true }, serverData: { type: Object, required: true } },
    setup: (props) => () => h('div', { class: 'render-graph-stub', 'data-height': props.height }),
  }),
}))

// jsdom has no layout and no ResizeObserver: a fake one lets the test say
// what size the browser reports for the container.
const observers: Array<(entries: unknown[]) => void> = []
class FakeResizeObserver {
  constructor(private cb: (entries: unknown[]) => void) {
    observers.push(cb)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
const resizeTo = (height: number) =>
  observers.forEach((cb) => cb([{ contentRect: { width: 1336, height } }]))

describe('CallGraph: graph height follows the container (frontend#391)', () => {
  beforeEach(() => {
    observers.length = 0
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    getCallGraph.mockReset()
    getCallGraph.mockResolvedValue(callGraphMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('waits for a real size, then passes it on and follows later resizes', async () => {
    const w = mount(CallGraph, { props: { id: 'p1' } })
    await flushPromises()

    // Laid out with no height yet (the tab panel before layout): no zero-height graph.
    expect(w.find('.render-graph-stub').exists()).toBe(false)

    resizeTo(500)
    await flushPromises()
    expect(w.get('.render-graph-stub').attributes('data-height')).toBe('500')

    // Fullscreen or a window resize changes the container: the graph follows.
    resizeTo(900.6)
    await flushPromises()
    expect(w.get('.render-graph-stub').attributes('data-height')).toBe('900')
  })
})

describe('CallGraph: collapsing recursion', () => {
  const toggle = '.call-graph__toolbar-btn--recursion'

  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    getCallGraph.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('offers no toggle when the server does not tell how it shows recursion', async () => {
    getCallGraph.mockResolvedValue(callGraphMock)

    const w = mount(CallGraph, { props: { id: 'p1' } })
    await flushPromises()

    expect(w.find(toggle).exists()).toBe(false)
  })

  it('asks for the collapsed graph and remembers the choice', async () => {
    getCallGraph.mockImplementation(async (_id: string, params: Record<string, string>) => ({
      ...callGraphMock,
      recursion: params.recursion,
    }))

    const w = mount(CallGraph, { props: { id: 'p1' } })
    await flushPromises()
    expect(getCallGraph).toHaveBeenLastCalledWith('p1', expect.objectContaining({ recursion: 'levels' }))
    expect(w.get(toggle).attributes('aria-pressed')).toBe('false')

    await w.get(toggle).trigger('click')
    await flushPromises()

    expect(getCallGraph).toHaveBeenLastCalledWith('p1', expect.objectContaining({ recursion: 'collapsed' }))
    expect(w.get(toggle).attributes('aria-pressed')).toBe('true')

    // Another profile opens collapsed too
    getCallGraph.mockClear()
    mount(CallGraph, { props: { id: 'p2' } })
    await flushPromises()
    expect(getCallGraph).toHaveBeenLastCalledWith('p2', expect.objectContaining({ recursion: 'collapsed' }))
  })
})
