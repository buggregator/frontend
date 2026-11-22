import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSmtp } from '../../lib'
import { smtpWelcomeMock } from '../../mocks'
import SmtpPage from './smtp-page.vue'

const { normalizeSmtpEvent } = useSmtp()

// Node 25+ has its own global `localStorage` that hides jsdom's and has no
// working `getItem`, so the page's stores get a small in-memory one.
const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear(),
  }
}

describe('SmtpPage: HTML preview', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":[]}'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // A captured email is untrusted: its scripts must not run in the app's
  // origin, where they could call the API with the user's token.
  it('renders the email HTML in a sandboxed frame without scripts or same-origin', () => {
    const wrapper = mount(SmtpPage, {
      props: { event: normalizeSmtpEvent(smtpWelcomeMock) },
      attachTo: document.body,
    })

    const frame = wrapper.find('iframe')
    expect(frame.exists()).toBe(true)

    const sandbox = frame.attributes('sandbox')
    expect(sandbox).toBeDefined()
    expect(sandbox).not.toContain('allow-scripts')
    expect(sandbox).not.toContain('allow-same-origin')
    expect(frame.attributes('srcdoc')).toContain('<base target="_blank">')

    wrapper.unmount()
  })

  // Audit 5.18: an email without a Message-ID showed an empty «Message ID» row.
  it('hides the Message ID row when the email has none', () => {
    const event = normalizeSmtpEvent({ ...smtpWelcomeMock, payload: { ...smtpWelcomeMock.payload, id: '' } })
    const wrapper = mount(SmtpPage, { props: { event } })
    expect(wrapper.text()).not.toContain('Message ID')

    const withId = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpWelcomeMock) } })
    expect(withId.text()).toContain('Message ID')
  })

  it('the body views are a tablist of the shared Tabs, HTML preview first (#6737 A)', async () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpWelcomeMock) } })
    const list = wrapper.get('[role="tablist"]')
    expect(list.attributes('aria-label')).toBe('Email body')
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((t) => t.text())).toEqual(['HTML Preview', 'Text', 'HTML Source', 'Raw'])
    expect(wrapper.find('iframe').exists()).toBe(true)
    await tabs[3].trigger('click')
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(tabs[3].attributes('id'))
  })
})
