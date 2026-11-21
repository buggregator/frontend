import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EventDetailLayout from './event-detail-layout.vue'

describe('EventDetailLayout', () => {
  it('shows the title, the subtitle and the formatted date', () => {
    const w = mount(EventDetailLayout, {
      props: { title: 'Browser report', subtitle: 'Reporting API', date: new Date(2026, 10, 21, 10, 5, 7) }
    })
    expect(w.find('.event-detail__title').text()).toBe('Browser report')
    expect(w.find('[data-test="event-detail-subtitle"]').text()).toBe('Reporting API')
    expect(w.find('span.event-detail__date').text()).toBe('21.11.2026 10:05:07')
  })

  it('has no subtitle line when none is given', () => {
    const w = mount(EventDetailLayout, { props: { title: 'Dump' } })
    expect(w.find('[data-test="event-detail-subtitle"]').exists()).toBe(false)
  })
})
