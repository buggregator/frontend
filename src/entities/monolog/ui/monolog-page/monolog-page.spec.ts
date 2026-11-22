import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { useMonolog } from '../../lib'
import { monologMock, monologWithExtraMock } from '../../mocks'
import MonologPage from './monolog-page.vue'

const { normalizeMonologEvent } = useMonolog()

const sectionTitles = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.event-section__title').map((el) => el.text().trim())

// The JSON tree is loaded on demand.
const loaded = async () => {
  await flushPromises()
  await new Promise((r) => setTimeout(r, 0))
  await flushPromises()
}

describe('MonologPage', () => {
  // https://github.com/buggregator/frontend/issues/288
  it('shows the extra object once, in the message box', async () => {
    const wrapper = mount(MonologPage, {
      props: { event: normalizeMonologEvent(monologWithExtraMock) },
    })
    await loaded()

    const extra = wrapper.findAll('.monolog-box [aria-label="Extra"]')
    expect(extra).toHaveLength(1)
    expect(extra[0]!.text()).toContain('uid')
    expect(extra[0]!.text()).toContain('156865')
    expect(sectionTitles(wrapper)).not.toContain('Extra')
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

  it('shows message, context and extra in one box, like the feed (frontend#283)', async () => {
    const wrapper = mount(MonologPage, {
      props: { event: withContext({ user_id: 5, roles: ['admin'] }) },
    })
    await loaded()
    const box = wrapper.get('.monolog-box')
    const section = box.get('[aria-label="Context"]')
    expect(box.findAll('.code-snippet')).toHaveLength(1)
    expect(section.find('.json-tree-view').exists()).toBe(true)
    expect(section.text()).toContain('user_id')
    expect(section.text()).toContain('"admin"')
  })

  it('starts a big context folded to its top-level keys', async () => {
    const big = { order: { lines: Array.from({ length: 80 }, (_, i) => ({ sku: `SKU-${i}`, qty: i })) } }
    const wrapper = mount(MonologPage, { props: { event: withContext(big) } })
    await loaded()
    const section = wrapper.get('.monolog-box [aria-label="Context"]')
    expect(section.text()).toContain('order')
    expect(section.text()).not.toContain('SKU-1')
  })
})
