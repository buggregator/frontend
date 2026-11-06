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
