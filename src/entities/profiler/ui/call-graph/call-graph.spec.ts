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
