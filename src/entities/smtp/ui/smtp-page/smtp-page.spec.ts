import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSmtp } from '../../lib'
import { smtpAmpMock, smtpCancelMock, smtpInviteMock, smtpWatchMock, smtpWelcomeMock } from '../../mocks'
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
    expect(wrapper.get('iframe').isVisible()).toBe(false)
    expect(wrapper.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(tabs[3].attributes('id'))
  })

  // The HTML preview stays mounted: the frame does not reload on a tab switch.
  it('keeps the same HTML frame across tab switches', async () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpWelcomeMock) }, attachTo: document.body })
    const frame = wrapper.get('iframe').element
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[3].trigger('click')
    await tabs[0].trigger('click')
    expect(wrapper.get('iframe').element).toBe(frame)
    expect(wrapper.get('iframe').isVisible()).toBe(true)
    wrapper.unmount()
  })
})

// #6829: other versions of the body (Apple Watch, AMP, calendar) and the invite.
describe('SmtpPage: other parts and the invite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":[]}'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const tabNames = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('[role="tab"]').map((t) => t.text())

  it('an Apple Watch part is a tab before Raw, with a Watch badge', () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpWatchMock) } })
    expect(tabNames(wrapper).slice(-2)).toEqual(['Apple Watch', 'Raw'])
    expect(wrapper.findAll('[data-test="smtp-part-badge"]').map((b) => b.text())).toEqual(['Watch'])
  })

  // AMP is untrusted HTML with scripts: the same sandbox as the main HTML.
  it('the AMP tab shows the part in a sandboxed frame without scripts', async () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpAmpMock) }, attachTo: document.body })
    const amp = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'AMP')!
    await amp.trigger('click')

    const frame = wrapper.get('iframe[title="AMP preview"]')
    expect(frame.isVisible()).toBe(true)
    expect(frame.attributes('sandbox')).not.toContain('allow-scripts')
    expect(frame.attributes('srcdoc')).toContain(smtpAmpMock.payload.parts[0].content)
    expect(wrapper.text()).toContain('AMP scripts do not run here')
    wrapper.unmount()
  })

  it('an invite shows a card: what, when, where, who, and a Calendar tab with the source', async () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpInviteMock) } })
    const card = wrapper.get('.smtp-invite')
    expect(card.text()).toContain('Invitation')
    expect(card.text()).toContain('Release sync')
    expect(card.text()).toContain('Room 4; floor 2')
    expect(card.get('[data-test="invite-when"]').text()).toMatch(/1 Dec 2026/)
    expect(tabNames(wrapper)).toContain('Calendar')
    expect(wrapper.findAll('[data-test="smtp-part-badge"]').map((b) => b.text())).toEqual(['Invite'])
  })

  it('a cancelled invite is marked cancelled, its time in the sender zone', () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpCancelMock) } })
    const card = wrapper.get('.smtp-invite')
    expect(card.classes()).toContain('smtp-invite--cancelled')
    expect(card.text()).toContain('Cancelled')
    expect(card.get('[data-test="invite-when"]').text()).toContain('14:00 – 15:00 (W. Europe Standard Time)')
  })

  it('an ordinary email has no invite card, no badges and the old tabs', () => {
    const wrapper = mount(SmtpPage, { props: { event: normalizeSmtpEvent(smtpWelcomeMock) } })
    expect(wrapper.find('.smtp-invite').exists()).toBe(false)
    expect(wrapper.find('[data-test="smtp-part-badge"]').exists()).toBe(false)
    expect(tabNames(wrapper)).toEqual(['HTML Preview', 'Text', 'HTML Source', 'Raw'])
  })
})
