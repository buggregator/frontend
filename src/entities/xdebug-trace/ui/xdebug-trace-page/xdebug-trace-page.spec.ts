import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { normalizeXdebugTraceEvent } from '../../lib/normalize-xdebug-trace-event'
import { xdebugTraceMock } from '../../mocks'
import XdebugTracePage from './xdebug-trace-page.vue'

vi.mock('../../lib/use-xdebug-trace-requests', () => ({
  useXdebugTraceRequests: () => ({
    getTree: vi.fn(() => new Promise(() => {})),
    search: vi.fn(() => new Promise(() => {})),
    getSummary: vi.fn(() => new Promise(() => {})),
  }),
}))

describe('XdebugTracePage: tabs (#6737 A)', () => {
  it('Call tree and Slowest & top as a tablist; the call tree stays mounted while hidden', async () => {
    const w = mount(XdebugTracePage, {
      props: { event: normalizeXdebugTraceEvent(xdebugTraceMock as never) },
      global: { stubs: { TraceSearch: true, TraceTree: true, TraceSummary: true } },
    })
    const tabs = w.findAll('[role="tab"]')
    expect(tabs.map((t) => t.text())).toEqual(['Call tree', 'Slowest & top'])
    await tabs[1].trigger('click')
    expect(w.find('trace-tree-stub').exists()).toBe(true)
    expect(w.get('[aria-selected="true"]').text()).toBe('Slowest & top')
  })
})
