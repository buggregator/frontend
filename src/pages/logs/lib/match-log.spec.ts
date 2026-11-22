import { describe, expect, it } from 'vitest'
import { parseLogsQuery } from './logs-filters'
import { matchesLog } from './match-log'
import { logLine } from './test-utils'

const line = logLine('1', {
  message: 'Charging card for order draft #A-1043',
  channel: 'payments',
  level: 400,
  level_name: 'ERROR',
  context: { cart_id: 8812, customer: { email: 'anna@example.com' } },
  extra: { hostname: 'anna-mbp', trace_id: 'aca37' }
})

const f = (query: Record<string, string | string[]>) => parseLogsQuery(query)

describe('matchesLog', () => {
  it('needs every search word somewhere: message, channel, context or extra keys and values', () => {
    expect(matchesLog(line, f({ q: 'ORDER card' }))).toBe(true)
    expect(matchesLog(line, f({ q: 'payments anna@example' }))).toBe(true)
    expect(matchesLog(line, f({ q: 'cart_id hostname' }))).toBe(true)
    expect(matchesLog(line, f({ q: 'order refund' }))).toBe(false)
  })

  it('applies the level, channel and trace picks', () => {
    expect(matchesLog(line, f({ level: ['error', 'warning'] }))).toBe(true)
    expect(matchesLog(line, f({ level: 'info' }))).toBe(false)
    expect(matchesLog(line, f({ channel: 'app' }))).toBe(false)
    expect(matchesLog(line, f({ trace: 'aca37' }))).toBe(true)
    expect(matchesLog(line, f({ trace: 'other' }))).toBe(false)
  })
})
