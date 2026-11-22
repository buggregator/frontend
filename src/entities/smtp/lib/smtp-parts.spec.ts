import { describe, expect, it } from 'vitest'
import type { SMTPCalendar } from '../types'
import {
  attendeeStatusLabel,
  formatInviteWhen,
  inviteState,
  isHtmlPart,
  listBadges,
  partTabs,
  personLabel,
  repeatLabel,
} from './smtp-parts'

const tz = { timeZone: 'Europe/Berlin', locale: 'en-GB' }

describe('smtp parts (#6829)', () => {
  it('HTML-like parts: Apple Watch and AMP', () => {
    expect(isHtmlPart('text/watch-html')).toBe(true)
    expect(isHtmlPart('TEXT/X-AMP-HTML')).toBe(true)
    expect(isHtmlPart('text/calendar')).toBe(false)
  })

  it('a tab per part, in message order', () => {
    expect(partTabs([
      { type: 'text/watch-html', label: 'Apple Watch' },
      { type: 'text/x-foo', label: '' },
    ])).toEqual([
      { id: 'part-0', label: 'Apple Watch' },
      { id: 'part-1', label: 'text/x-foo' },
    ])
    expect(partTabs(undefined)).toEqual([])
  })

  it.each([
    [{ summary: 'x', method: 'REQUEST' }, 'invite'],
    [{ summary: 'x', method: 'CANCEL' }, 'cancelled'],
    [{ summary: 'x', method: 'REQUEST', status: 'CANCELLED' }, 'cancelled'],
    [{ summary: 'x', method: 'REPLY' }, 'reply'],
    [{ summary: 'x', method: 'PUBLISH' }, 'event'],
    [{ summary: 'x' }, 'event'],
  ] as [SMTPCalendar, string][])('invite state %o → %s', (cal, state) => {
    expect(inviteState(cal)).toBe(state)
  })

  it('list badges: Watch, AMP, Invite; cancelled invite named so', () => {
    expect(listBadges({
      parts: [
        { type: 'text/watch-html', label: 'Apple Watch' },
        { type: 'text/x-amp-html', label: 'AMP' },
        { type: 'text/calendar', label: 'Calendar' },
      ],
      calendar: { summary: 'Sync', method: 'REQUEST' },
    })).toEqual(['Watch', 'AMP', 'Invite'])
    expect(listBadges({ calendar: { summary: 'Sync', method: 'CANCEL' } })).toEqual(['Cancelled'])
    expect(listBadges({})).toEqual([])
  })

  it('when: zone known → in the viewer zone, one day shows the date once', () => {
    expect(formatInviteWhen({ summary: 'x', start: '2026-12-03T13:00:00Z', end: '2026-12-03T14:00:00Z' }, tz))
      .toBe('Thu, 3 Dec 2026, 14:00 – 15:00 (CET)')
  })

  it('when: zone known, over two days → both dates', () => {
    expect(formatInviteWhen({ summary: 'x', start: '2026-12-03T22:00:00Z', end: '2026-12-04T01:00:00Z' }, tz))
      .toBe('Thu, 3 Dec 2026, 23:00 – Fri, 4 Dec 2026, 02:00 (CET)')
  })

  it('when: zone not known → the sender\'s clock and zone name', () => {
    expect(formatInviteWhen({
      summary: 'x', start: '2026-12-03T14:00:00', end: '2026-12-03T15:30:00', tz: 'W. Europe Standard Time',
    }, tz)).toBe('Thu, 3 Dec 2026, 14:00 – 15:30 (W. Europe Standard Time)')
  })

  it('when: all day; DTEND is exclusive', () => {
    expect(formatInviteWhen({ summary: 'x', start: '2026-12-05', end: '2026-12-06', all_day: true }, tz))
      .toBe('Sat, 5 Dec 2026, all day')
    expect(formatInviteWhen({ summary: 'x', start: '2026-12-05', end: '2026-12-08', all_day: true }, tz))
      .toBe('Sat, 5 Dec 2026 – Mon, 7 Dec 2026, all day')
  })

  it('when: no start → empty; bad date → as sent', () => {
    expect(formatInviteWhen({ summary: 'x' }, tz)).toBe('')
    expect(formatInviteWhen({ summary: 'x', start: 'tomorrow' }, tz)).toBe('tomorrow')
  })

  it('repeats: plain words for simple rules, else the rule', () => {
    expect(repeatLabel('FREQ=WEEKLY;BYDAY=MO')).toBe('Repeats weekly (FREQ=WEEKLY;BYDAY=MO)')
    expect(repeatLabel('FREQ=DAILY')).toBe('Repeats daily')
    expect(repeatLabel('X-FOO=1')).toBe('Repeats: X-FOO=1')
    expect(repeatLabel(undefined)).toBe('')
  })

  it('attendee status and person', () => {
    expect(attendeeStatusLabel('ACCEPTED')).toBe('Accepted')
    expect(attendeeStatusLabel('needs-action')).toBe('No answer')
    expect(attendeeStatusLabel('TENTATIVE')).toBe('Maybe')
    expect(attendeeStatusLabel(undefined)).toBe('')
    expect(personLabel({ name: 'Ann', email: 'ann@x.test' })).toBe('Ann <ann@x.test>')
    expect(personLabel({ email: 'ann@x.test' })).toBe('ann@x.test')
  })
})
