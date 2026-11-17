import { describe, expect, it } from 'vitest'
import { navLinkLabel } from './nav-label'

// Audit 5.14: the colored dot said «there are events» by color only. The «new»
// badge and the count are visual; the name carries the same facts.
describe('navLinkLabel', () => {
  it('says how many events a section has', () => {
    expect(navLinkLabel('Sentry', 0)).toBe('Sentry')
    expect(navLinkLabel('Sentry', 1)).toBe('Sentry, 1 event')
    expect(navLinkLabel('SMTP', 315)).toBe('SMTP, 315 events')
  })

  it('says how many of them are new', () => {
    expect(navLinkLabel('Sentry', 5, 3)).toBe('Sentry, 3 new, 5 events')
    expect(navLinkLabel('Ray', 1, 1)).toBe('Ray, 1 new, 1 event')
  })
})
