import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import PreviewCardFooter from './preview-card-footer.vue'
import PreviewCard from './preview-card.vue'

vi.mock('../../lib/use-events', () => ({
  useEvents: () => ({ events: { removeById: vi.fn(), getItem: vi.fn() }, lockedIds: { items: ref([]) } }),
}))

const event = { id: 'ev1', type: 'smtp', labels: [], date: null, origin: null, serverName: '', payload: {} }

const render = () =>
  mount(PreviewCard, {
    props: { event } as never,
    slots: { default: '<p class="body">body</p>' },
    global: {
      stubs: {
        PreviewCardHeader: { template: '<div><button class="toggle" @click="$emit(\'toggle-view\')"/></div>' },
        PreviewCardFooter: true,
      },
    },
  })

describe('PreviewCard', () => {
  // The virtual feed unmounts cards that scroll away; a collapsed card came
  // back expanded.
  it('stays collapsed after it is unmounted and mounted again', async () => {
    const first = render()
    expect(first.find('.body').exists()).toBe(true)
    await first.get('.toggle').trigger('click')
    expect(first.find('.body').exists()).toBe(false)
    first.unmount()

    const again = render()
    expect(again.find('.body').exists()).toBe(false)
    await again.get('.toggle').trigger('click')
    expect(again.find('.body').exists()).toBe(true)
  })

  // Audit 5.12: a Sentry message without an environment showed «env null».
  it('passes no empty origin value to the footer', () => {
    const wrapper = mount(PreviewCard, {
      props: { event: { ...event, origin: { environment: null, logger: undefined, release: '', host: 'web-1' } } } as never,
      global: { stubs: { PreviewCardHeader: true, PreviewCardFooter: true } },
    })
    expect(wrapper.findComponent(PreviewCardFooter).props('originConfig')).toEqual({ host: 'web-1' })
  })
})
