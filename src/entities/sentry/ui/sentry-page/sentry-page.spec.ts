import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerEvent } from '@/shared/types'
import { useSentry } from '../../lib'
import { sentryGoMessageMock, sentryLaravelMock } from '../../mocks'
import type { Sentry } from '../../types'
import SentryPage from './sentry-page.vue'

const { normalizeSentryEvent } = useSentry()

describe('SentryPage: tabs (#6737 A)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":[]}'))))
  })

  it('the shared Tabs as a tablist with counts; the panel shows the selected section', async () => {
    const w = mount(SentryPage, {
      props: { event: normalizeSentryEvent(sentryLaravelMock as unknown as ServerEvent<Sentry>) },
      global: { stubs: { SentryEventFeedback: true, SentryException: true, SentryPageBreadcrumbs: true, SentryPageRequest: true } },
      attachTo: document.body,
    })
    const list = w.get('[role="tablist"]')
    expect(list.attributes('aria-label')).toBe('Event sections')
    const names = w.findAll('[role="tab"]').map((t) => t.text())
    expect(names[0]).toMatch(/^Exceptions \d+$/)
    expect(w.findAll('[role="tab"]')[0].attributes('aria-selected')).toBe('true')
    expect(w.find('.tabs-component').exists()).toBe(false)

    const request = w.findAll('[role="tab"]').find((t) => t.text() === 'Request')!
    expect(w.get('sentry-page-request-stub').isVisible()).toBe(false)
    await request.trigger('click')
    expect(w.get('sentry-page-request-stub').isVisible()).toBe(true)
    // The other panels stay mounted, hidden: their state survives a switch.
    expect(w.get('.sentry-exceptions').isVisible()).toBe(false)
    expect(w.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(request.attributes('id'))
    w.unmount()
  })
})

// sentry-go sends threads and breadcrumbs as bare lists, not {values: [...]}:
// `threads.values` was Array.prototype.values, «function is not iterable»,
// and the page stayed blank. The trace probe answers 404: no stored transaction.
describe('SentryPage: a sentry-go message event (#7098)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"error":"not found"}', { status: 404 }))))
  })

  it('renders the message, its stacktrace and breadcrumbs', async () => {
    const w = mount(SentryPage, {
      props: { event: normalizeSentryEvent(sentryGoMessageMock as unknown as ServerEvent<Sentry>) },
      global: { stubs: { SentryEventFeedback: true, SentryPageRequest: true } },
      attachTo: document.body,
    })
    await flushPromises()
    expect(w.get('.sentry-header').text()).toContain('Payment gateway slow')
    const names = w.findAll('[role="tab"]').map((t) => t.text())
    expect(names).toContain('Breadcrumbs 1')
    // The frame's file: sentry-go sends only abs_path.
    expect(w.text()).toContain('/app/main.go')
    // The breadcrumb time: an RFC 3339 string, not Unix seconds.
    expect(w.text()).not.toContain('Invalid date')
    w.unmount()
  })
})
