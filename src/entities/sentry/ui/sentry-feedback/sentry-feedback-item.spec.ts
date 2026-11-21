import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { SentryFeedback } from '../../types'
import SentryFeedbackItem from './sentry-feedback-item.vue'

const item = (over: Partial<SentryFeedback> = {}): SentryFeedback => ({
  id: '1', project: 'shop', event_id: 'aaaa-bbbb', feedback_id: 'f1', name: 'Ann', email: 'ann@example.com',
  message: 'The pay button does nothing', url: 'http://shop.test/cart', source: 'feedback',
  received_at: '2026-11-21T10:00:00Z', ...over
})

const mountItem = (over: Partial<SentryFeedback> = {}, showError = false) =>
  mount(SentryFeedbackItem, {
    props: { item: item(over), showError },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

describe('SentryFeedbackItem', () => {
  it('shows who wrote what, with a mail link and the page', () => {
    const w = mountItem()
    expect(w.text()).toContain('Ann')
    expect(w.text()).toContain('The pay button does nothing')
    expect(w.find('a[href="mailto:ann@example.com"]').exists()).toBe(true)
    expect(w.find('a[href="http://shop.test/cart"]').attributes('rel')).toBe('noopener noreferrer')
  })

  it('does not make a link of a non-web address', () => {
    const w = mountItem({ url: 'javascript:alert(1)' })
    expect(w.find('a[href^="javascript"]').exists()).toBe(false)
    expect(w.text()).toContain('javascript:alert(1)')
  })

  it('falls back to the email, then Anonymous', () => {
    expect(mountItem({ name: '' }).text()).toContain('ann@example.com')
    expect(mountItem({ name: '', email: '' }).text()).toContain('Anonymous')
  })

  // The server keeps the error's uuid as the SDK sent it, dashes and all.
  it('links the error with its id as sent on the Feedback tab', () => {
    const w = mountItem({}, true)
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/sentry/event/aaaa-bbbb')
  })

  it('says when feedback came without an error', () => {
    const w = mountItem({ event_id: '' }, true)
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
    expect(w.text()).toContain('Sent without an error')
  })

  it('marks a legacy user report', () => {
    expect(mountItem({ source: 'user_report' }).text()).toContain('user report')
  })
})
