import { describe, expect, it } from 'vitest'
import { describeCrontab, describeSchedule, formatClock, formatRelative, knownTimeZone } from './cron-format'

describe('describeCrontab', () => {
  it.each([
    ['* * * * *', 'Every minute'],
    ['*/5 * * * *', 'Every 5 minutes'],
    ['*/1 * * * *', 'Every 1 minute'],
    ['5 * * * *', 'Hourly at :05'],
    ['0 */2 * * *', 'Every 2 hours at :00'],
    ['30 2 * * *', 'Daily at 02:30'],
    ['0 8 * * 5', 'Fridays at 08:00'],
    ['0 8 * * 7', 'Sundays at 08:00'],
    ['0 8 * * mon', 'Mondays at 08:00'],
    ['0 9 * * 1-5', 'Weekdays at 09:00'],
    ['0 4 1 * *', 'Monthly on day 1 at 04:00'],
    ['@hourly', 'Every hour'],
    ['@daily', 'Daily at 00:00'],
    ['@every 10m', 'Every 10m']
  ])('%s → %s', (expr, words) => {
    expect(describeCrontab(expr)).toBe(words)
  })

  it.each(['0 3 1 1 *', '0,30 * * * *', '0 3 * * 1,3', '1 2 3', '0 0 * * * *'])('leaves %s to the expression', (expr) => {
    expect(describeCrontab(expr)).toBeNull()
  })
})

describe('describeSchedule', () => {
  it('a crontab: words and the expression', () => {
    expect(describeSchedule({ type: 'crontab', value: '*/5 * * * *' })).toEqual({
      words: 'Every 5 minutes',
      expr: '*/5 * * * *'
    })
  })

  it('an odd crontab keeps the expression with neutral words', () => {
    expect(describeSchedule({ type: 'crontab', value: '0,30 * * * *' })).toEqual({
      words: 'Custom schedule',
      expr: '0,30 * * * *'
    })
  })

  it('an interval', () => {
    expect(describeSchedule({ type: 'interval', value: '10', unit: 'minute' })).toEqual({
      words: 'Every 10 minutes',
      expr: 'interval 10 minute'
    })
    expect(describeSchedule({ type: 'interval', value: '1', unit: 'hour' }).words).toBe('Every hour')
  })

  it('no schedule (a ping job before it gets one)', () => {
    expect(describeSchedule(null)).toEqual({ words: 'No schedule', expr: '' })
    expect(describeSchedule({ type: '', value: '' })).toEqual({ words: 'No schedule', expr: '' })
  })
})

describe('formatRelative', () => {
  const now = Date.parse('2026-11-21T14:12:00Z')
  it.each([
    ['2026-11-21T14:11:50Z', 'just now'],
    ['2026-11-21T14:10:00Z', '2 min ago'],
    ['2026-11-21T14:15:00Z', 'in 3 min'],
    ['2026-11-21T09:12:00Z', '5 h ago'],
    ['2026-11-18T14:12:00Z', '3 d ago']
  ])('%s → %s', (iso, text) => {
    expect(formatRelative(iso, now)).toBe(text)
  })

  it('nothing for no time or a bad one', () => {
    expect(formatRelative(null, now)).toBe('')
    expect(formatRelative('soon', now)).toBe('')
  })
})

describe('formatClock', () => {
  const now = Date.parse('2026-11-21T14:12:00Z')

  it('the time alone today, with the date another day', () => {
    expect(formatClock('2026-11-21T14:10:05.000Z', 'UTC', now)).toBe('14:10')
    expect(formatClock('2026-11-21T14:10:05.000Z', 'UTC', now, true)).toBe('14:10:05')
    expect(formatClock('2026-11-20T02:30:00.000Z', 'UTC', now)).toBe('20 Nov 02:30')
  })

  it('in the monitor time zone', () => {
    expect(formatClock('2026-11-21T02:00:00.000Z', 'Europe/Berlin', now)).toBe('03:00')
  })

  it('an unknown time zone falls back to UTC', () => {
    expect(knownTimeZone('Mars/Base')).toBe('UTC')
    expect(knownTimeZone('')).toBe('UTC')
    expect(formatClock('2026-11-21T14:10:00.000Z', 'Mars/Base', now)).toBe('14:10')
  })
})
