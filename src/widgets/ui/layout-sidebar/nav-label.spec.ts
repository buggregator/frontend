import { describe, expect, it } from 'vitest'
import { navLinkLabel } from './nav-label'

// Audit 5.14: the colored dot said «there are events» by color only.
describe('navLinkLabel', () => {
  it('says how many events a section has', () => {
    expect(navLinkLabel('Sentry', 0)).toBe('Sentry')
    expect(navLinkLabel('Sentry', 1)).toBe('Sentry, 1 event')
    expect(navLinkLabel('SMTP mails', 315)).toBe('SMTP mails, 315 events')
  })
})
