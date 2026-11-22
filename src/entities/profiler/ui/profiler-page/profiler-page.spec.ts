import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useProfiler } from '../../lib'
import { profilerMock } from '../../mocks'
import ProfilerPage from './profiler-page.vue'

setActivePinia(createPinia())
const { normalizeProfilerEvent } = useProfiler()

describe('ProfilerPage: tabs (#6737 A)', () => {
  it('Call graph, Flamechart, Top functions as a tablist; only the open view is mounted', async () => {
    const w = mount(ProfilerPage, {
      props: { event: normalizeProfilerEvent(profilerMock as never) },
      global: { stubs: { CallGraph: true, FlameGraph: true, TopFunctions: true } },
    })
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Event sections')
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Call graph', 'Flamechart', 'Top functions'])
    expect(w.find('call-graph-stub').exists()).toBe(true)
    await w.findAll('[role="tab"]')[2].trigger('click')
    expect(w.find('call-graph-stub').exists()).toBe(false)
    expect(w.find('top-functions-stub').exists()).toBe(true)
  })
})
