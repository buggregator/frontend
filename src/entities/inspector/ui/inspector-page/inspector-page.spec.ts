import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { useInspector } from '../../lib'
import { inspectorMock } from '../../mocks'
import InspectorPage from './inspector-page.vue'

const { normalizeInspectorEvent } = useInspector()

// Audit 5.18: the PHP SDK sends memory_peak already in MB
// (round(memory_get_peak_usage() / 1024 / 1024, 2)); the page divided again → «0.00 MB».
describe('InspectorPage: memory peak', () => {
  it('shows memory_peak as the MB value the SDK sent', () => {
    const wrapper = mount(InspectorPage, {
      props: { event: normalizeInspectorEvent(inspectorMock) },
      global: { stubs: { InspectorPageTimeline: true } },
    })
    const box = wrapper.findAll('.insp-box').find((b) => b.text().includes('Memory Peak'))
    expect(box?.text()).toContain('7.47 MB')
  })
})
