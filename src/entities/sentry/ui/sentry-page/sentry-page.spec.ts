import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerEvent } from '@/shared/types'
import { useSentry } from '../../lib'
import { sentryLaravelMock } from '../../mocks'
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
    await request.trigger('click')
    expect(w.find('sentry-page-request-stub').exists()).toBe(true)
    expect(w.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(request.attributes('id'))
    w.unmount()
  })
})
