import { describe, expect, it } from 'vitest'
import type { Monolog } from '../../types'
import { isMonologErrorLevel, monologLevelKey, monologLevelLabel } from './log-level'
import { monologClock, monologContextSummary, monologLineText, monologTraceId } from './log-line'

describe('monologLevelKey', () => {
  it('maps the level number, a custom one to the level below', () => {
    expect(monologLevelKey(100)).toBe('debug')
    expect(monologLevelKey(250)).toBe('notice')
    expect(monologLevelKey(399)).toBe('warning')
    expect(monologLevelKey(400)).toBe('error')
    expect(monologLevelKey(600)).toBe('emergency')
  })

  it('falls back to the name, then to debug', () => {
    expect(monologLevelKey(undefined, 'CRITICAL')).toBe('critical')
    expect(monologLevelKey(null, 'odd')).toBe('debug')
  })

  it('labels and error levels', () => {
    expect(monologLevelLabel('warning')).toBe('Warning')
    expect(['error', 'critical', 'alert', 'emergency'].every(isMonologErrorLevel)).toBe(true)
    expect(isMonologErrorLevel('warning')).toBe(false)
  })
})

describe('log line helpers', () => {
  it('finds the trace id in extra, then in context', () => {
    expect(monologTraceId({ context: {}, extra: { trace_id: 'abc' } })).toBe('abc')
    expect(monologTraceId({ context: { trace_id: 'ctx' }, extra: [] })).toBe('ctx')
    expect(monologTraceId({ context: { trace_id: 5 }, extra: [] })).toBeNull()
  })

  it('sums up plain context values', () => {
    expect(
      monologContextSummary({
        exception: 'App\\Boom',
        cart_id: 8812,
        nested: { a: 1 },
        email: 'a-very-long-address-for-the-summary@example.com',
        ok: true,
        more: 'x'
      })
    ).toBe('cart_id=8812 email=a-very-long-address-for-the-sum… ok=true')
    expect(monologContextSummary([])).toBe('')
  })

  it('formats the record time with milliseconds', () => {
    const iso = new Date(2026, 10, 22, 14, 2, 11, 482).toISOString()
    expect(monologClock(iso, 0)).toBe('14:02:11.482')
    expect(monologClock('', new Date(2026, 10, 22, 9, 5, 7).getTime() / 1000)).toBe('09:05:07.000')
  })

  it('writes the line as LineFormatter does', () => {
    const payload = {
      message: 'Cart started',
      context: { cart_id: 1 },
      extra: [],
      level: 200,
      level_name: 'INFO',
      channel: 'app',
      datetime: '2026-11-22T13:00:00+00:00'
    } as Monolog
    expect(monologLineText(payload)).toBe(
      '[2026-11-22T13:00:00+00:00] app.INFO: Cart started {"cart_id":1}'
    )
  })
})
