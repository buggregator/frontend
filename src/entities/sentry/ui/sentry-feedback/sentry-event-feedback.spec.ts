import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { SentryFeedback } from '../../types'
import SentryEventFeedback from './sentry-event-feedback.vue'

const state = { items: ref<SentryFeedback[]>([]), error: ref('') }

vi.mock('../../lib/use-sentry-feedback', () => ({
  useEventFeedback: () => state
}))

const item: SentryFeedback = {
  id: '1', project: 'shop', event_id: 'e1', feedback_id: 'f1', name: 'Ann', email: '',
  message: 'The pay button does nothing', url: '', source: 'feedback', received_at: '2026-11-21T10:00:00Z'
}

const mountIt = () =>
  mount(SentryEventFeedback, {
    props: { eventId: 'e1' },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

describe('SentryEventFeedback', () => {
  it('renders nothing without feedback', () => {
    state.items.value = []
    state.error.value = ''
    expect(mountIt().find('[data-test="sentry-event-feedback"]').exists()).toBe(false)
  })

  it('uses the shared section with title and count', () => {
    state.items.value = [item, { ...item, id: '2' }]
    state.error.value = ''
    const w = mountIt()
    const section = w.find('[data-test="sentry-event-feedback"]')
    expect(section.classes()).toContain('event-section')
    expect(section.classes()).toContain('event-feedback')
    expect(w.find('.event-section__title').text()).toContain('User feedback')
    expect(w.find('.event-section__count').text()).toBe('2')
  })

  it('shows a load error', () => {
    state.items.value = []
    state.error.value = 'Server error'
    const w = mountIt()
    expect(w.find('[role="alert"]').text()).toContain('Server error')
    expect(w.find('.event-section__count').exists()).toBe(false)
  })
})
