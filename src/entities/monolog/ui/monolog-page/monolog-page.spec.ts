import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { useMonolog } from '../../lib'
import { monologMock, monologWithExtraMock } from '../../mocks'
import MonologPage from './monolog-page.vue'

const { normalizeMonologEvent } = useMonolog()

const sectionTitles = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.event-section__title').map((el) => el.text().trim())

describe('MonologPage', () => {
  // https://github.com/buggregator/frontend/issues/288
  it('shows the extra object in one Extra section', () => {
    const wrapper = mount(MonologPage, {
      props: { event: normalizeMonologEvent(monologWithExtraMock) },
    })

    expect(wrapper.text()).toContain('Extra')
    expect(wrapper.text()).toContain('uid: 156865')
    expect(sectionTitles(wrapper).filter((t) => t === 'Extra')).toHaveLength(1)
  })

  it('hides the Extra section when extra is empty', () => {
    const wrapper = mount(MonologPage, {
      props: { event: normalizeMonologEvent(monologMock) },
    })

    expect(wrapper.text()).not.toContain('Extra')
  })
})

describe('MonologPage context', () => {
  const withContext = (context: Record<string, unknown>) => normalizeMonologEvent({
    ...monologMock,
    payload: { ...monologMock.payload, context },
  })

  it('shows context as the same folding tree as the feed (frontend#283)', () => {
    const wrapper = mount(MonologPage, {
      props: { event: withContext({ user_id: 5, roles: ['admin'] }) },
    })
    const section = wrapper.findAll('.event-section').find((s) => s.text().startsWith('Context'))!
    expect(section.find('.json-tree-view').exists()).toBe(true)
    expect(section.find('.code-snippet').exists()).toBe(false)
    expect(section.text()).toContain('user_id')
    expect(section.text()).toContain('"admin"')
  })

  it('starts a big context folded to its top-level keys', () => {
    const big = { order: { lines: Array.from({ length: 80 }, (_, i) => ({ sku: `SKU-${i}`, qty: i })) } }
    const wrapper = mount(MonologPage, { props: { event: withContext(big) } })
    const section = wrapper.findAll('.event-section').find((s) => s.text().startsWith('Context'))!
    expect(section.text()).toContain('order')
    expect(section.text()).not.toContain('SKU-1')
  })
})
