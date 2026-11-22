import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { ServerEvent } from '@/shared/types'
import { useSmtp } from '../../lib'
import { smtpCancelMock, smtpInviteMock, smtpWatchMock, smtpWelcomeMock } from '../../mocks'
import type { SMTP } from '../../types'
import PreviewCard from './preview-card.vue'

const { normalizeSmtpEvent } = useSmtp()

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)', component: { template: '<div/>' } }] })

// The list shows the parts the server names in the preview (#6829).
const preview = (mock: ServerEvent<SMTP>): ServerEvent<SMTP> => {
  const { parts, calendar, ...rest } = mock.payload
  return {
    ...mock,
    payload: {
      ...rest,
      ...(parts ? { parts: parts.map(({ type, label }) => ({ type, label })) } : {}),
      ...(calendar ? { calendar: { summary: calendar.summary, method: calendar.method, start: calendar.start, tz: calendar.tz, all_day: calendar.all_day } } : {}),
    },
  }
}

const mountCard = (mock: ServerEvent<SMTP>) =>
  mount(PreviewCard, {
    props: { event: normalizeSmtpEvent(preview(mock)) },
    global: { plugins: [router], stubs: { PreviewCard: { template: '<div><slot/></div>' } } },
  })

describe('SMTP preview card: parts and invite (#6829)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('an invite: badge and one line with what and when', () => {
    const card = mountCard(smtpInviteMock)
    expect(card.findAll('[data-test="smtp-list-badge"]').map((b) => b.text())).toEqual(['Invite'])
    expect(card.get('[data-test="smtp-list-invite"]').text()).toMatch(/^Release sync · .*1 Dec 2026/)
  })

  it('a cancelled invite is struck out', () => {
    const card = mountCard(smtpCancelMock)
    expect(card.findAll('[data-test="smtp-list-badge"]').map((b) => b.text())).toEqual(['Cancelled'])
    expect(card.get('[data-test="smtp-list-invite"]').classes()).toContain('smtp-body__invite--cancelled')
  })

  it('an Apple Watch version: Watch badge, no invite line', () => {
    const card = mountCard(smtpWatchMock)
    expect(card.findAll('[data-test="smtp-list-badge"]').map((b) => b.text())).toEqual(['Watch'])
    expect(card.find('[data-test="smtp-list-invite"]').exists()).toBe(false)
  })

  it('an ordinary email: no new marks', () => {
    const card = mountCard(smtpWelcomeMock)
    expect(card.find('[data-test="smtp-list-badge"]').exists()).toBe(false)
  })
})
