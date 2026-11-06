import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSmtp } from '../../lib'
import { smtpWelcomeMock } from '../../mocks'
import SmtpPage from './smtp-page.vue'

const { normalizeSmtpEvent } = useSmtp()

describe('SmtpPage: HTML preview', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"data":[]}'))))
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
})
