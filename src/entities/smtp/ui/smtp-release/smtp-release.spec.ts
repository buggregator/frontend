import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SmtpRelayInfo } from '../../lib/smtp-relay'
import { useSmtpRelay } from '../../lib/smtp-relay'
import SmtpRelayStatus from './smtp-relay-status.vue'
import SmtpRelease from './smtp-release.vue'

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

const memoryStorage = () => {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, String(value)),
    removeItem: (key: string) => void items.delete(key),
    clear: () => items.clear()
  }
}

const on: SmtpRelayInfo = {
  enabled: true,
  configured: true,
  host: 'mailpit',
  port: 1025,
  tls: 'none',
  auth: false,
  from: '',
  allowed_recipients: ['*@ex.com'],
  max_recipients: 20,
  local_only: true
}
const notSetUp: SmtpRelayInfo = { enabled: false, configured: false }
const needsList: SmtpRelayInfo = {
  ...on,
  enabled: false,
  allowed_recipients: [],
  reason: 'Auth is off: set smtp_relay.allowed_recipients.'
}

describe('SmtpRelease', () => {
  const fetchMock = vi.fn((url: string, _init?: RequestInit) =>
    url.endsWith('/api/smtp/relay') ? json(on) : json({ status: true, to: ['me@ex.com'] })
  )

  // Gives the relay answer and loads it into the shared cache.
  const relay = async (info: SmtpRelayInfo) => {
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('/api/smtp/relay') ? json(info) : json({ status: true, to: ['me@ex.com'] })
    )
    await useSmtpRelay().load(true)
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
    // jsdom has no modal dialogs.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountIt = async () => {
    const wrapper = mount(SmtpRelease, { props: { eventId: 'ev-1' }, attachTo: document.body })
    await flushPromises()
    return wrapper
  }

  it('shows nothing on a server without the relay route', async () => {
    fetchMock.mockImplementation(() => json({}, 404))
    await useSmtpRelay().load(true)
    const wrapper = await mountIt()

    expect(wrapper.find('[data-test="smtp-release-open"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('says how to set the relay up when it is not configured', async () => {
    await relay(notSetUp)
    const wrapper = await mountIt()

    expect(wrapper.text()).toContain('Relay not set up')
    await wrapper.get('[data-test="smtp-release-open"]').trigger('click')
    expect(wrapper.find('[data-test="smtp-relay-setup"]').text()).toContain('SMTP_RELAY_HOST')
    expect(wrapper.find('[data-test="smtp-release-send"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the server reason when the relay is set but off', async () => {
    await relay(needsList)
    const wrapper = await mountIt()
    await wrapper.get('[data-test="smtp-release-open"]').trigger('click')

    expect(wrapper.get('[data-test="smtp-release-reason"]').text()).toBe(needsList.reason)
    expect(wrapper.get('[data-test="smtp-relay-setup"]').text()).toContain('SMTP_RELAY_ALLOWED_RECIPIENTS')
    wrapper.unmount()
  })

  it('blocks Send on a bad address and sends the good ones', async () => {
    await relay(on)
    const wrapper = await mountIt()
    await wrapper.get('[data-test="smtp-release-open"]').trigger('click')

    const input = wrapper.get('[data-test="smtp-release-to"]')
    await input.setValue('me@ex.com, nope')
    expect(wrapper.get('[data-test="smtp-release-send"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Not an address: nope')
    expect(input.attributes('aria-invalid')).toBe('true')

    await input.setValue('Me@ex.com')
    await wrapper.get('[data-test="smtp-release-rewrite"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [url, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(url).toContain('/api/smtp/release/ev-1')
    expect(JSON.parse(String(init.body))).toEqual({ to: ['Me@ex.com'], rewrite_to: true })
    expect(wrapper.get('[data-test="smtp-release-ok"]').text()).toContain('me@ex.com')
    expect(localStorage.getItem('smtp_release_to')).toBe('Me@ex.com')
    wrapper.unmount()
  })

  it('shows the server error', async () => {
    await relay(on)
    fetchMock.mockImplementation(() => json({ code: 'rate_limited', message: 'Too many sends, wait a minute.' }, 429))
    const wrapper = await mountIt()
    await wrapper.get('[data-test="smtp-release-open"]').trigger('click')
    await wrapper.get('[data-test="smtp-release-to"]').setValue('me@ex.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-test="smtp-release-error"]').text()).toBe('Too many sends, wait a minute.')
    expect(wrapper.find('[data-test="smtp-release-ok"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('puts focus back on the button after closing', async () => {
    await relay(on)
    const wrapper = await mountIt()
    const opener = wrapper.get('[data-test="smtp-release-open"]')
    await opener.trigger('click')
    expect(document.activeElement).toBe(wrapper.get('[data-test="smtp-release-to"]').element)

    wrapper.get<HTMLDialogElement>('dialog').element.close()
    expect(document.activeElement).toBe(opener.element)
    wrapper.unmount()
  })
})

describe('SmtpRelayStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const withRelay = async (info: SmtpRelayInfo | null) => {
    vi.stubGlobal('fetch', vi.fn(() => (info ? json(info) : json({}, 404))))
    await useSmtpRelay().load(true)
    const wrapper = mount(SmtpRelayStatus)
    await flushPromises()
    return wrapper
  }

  it('lists the relay settings, never a password', async () => {
    const wrapper = await withRelay(on)

    expect(wrapper.get('[data-test="smtp-relay-pill"]').text()).toBe('On')
    expect(wrapper.text()).toContain('mailpit:1025 · no TLS · no login')
    expect(wrapper.text()).toContain('*@ex.com')
    expect(wrapper.text()).toContain('This machine only')
    expect(wrapper.text().toLowerCase()).not.toContain('password')
  })

  it('shows Off with the reason and the missing config', async () => {
    const wrapper = await withRelay(needsList)

    expect(wrapper.get('[data-test="smtp-relay-pill"]').text()).toBe('Off')
    expect(wrapper.get('[data-test="smtp-relay-reason"]').text()).toBe(needsList.reason)
    expect(wrapper.find('[data-test="smtp-relay-setup"]').exists()).toBe(true)
  })

  it('says the server cannot send on an older server', async () => {
    const wrapper = await withRelay(null)

    expect(wrapper.find('[data-test="smtp-relay-unavailable"]').exists()).toBe(true)
  })
})
