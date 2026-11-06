import { describe, expect, it } from 'vitest'
import { EventTypes, type ServerEvent } from '../../types'
import { normalizeEvent } from './normalize-event'

const event = (timestamp: number): ServerEvent<{ a: number }> => ({
  uuid: 'id-1',
  type: EventTypes.Sms,
  payload: { a: 1 },
  project: null,
  timestamp,
})

// Audit 1.14: the shared part of every normalize-*-event.
describe('normalizeEvent', () => {
  it('puts the time label first and fills the defaults', () => {
    const local = new Date(2026, 0, 2, 13, 4, 5)
    const result = normalizeEvent(event(local.getTime() / 1000), { type: EventTypes.Sms, labels: [EventTypes.Sms] })
    expect(result).toEqual({
      id: 'id-1',
      type: EventTypes.Sms,
      labels: ['13:04:05', EventTypes.Sms],
      origin: null,
      serverName: '',
      date: local,
      payload: { a: 1 },
    })
    expect('meta' in result).toBe(false)
  })

  it('has no date and no time label without a timestamp', () => {
    const result = normalizeEvent(event(0), { type: EventTypes.Sms, labels: ['x'] })
    expect(result.date).toBeNull()
    expect(result.labels).toEqual(['x'])
  })

  it('keeps origin, server name and meta it is given, and does not share the labels array', () => {
    const labels = ['x']
    const result = normalizeEvent(event(0), { type: EventTypes.RayDump, labels, origin: { o: 1 }, serverName: 'host', meta: { color: 'red' } })
    expect(result).toMatchObject({ origin: { o: 1 }, serverName: 'host', meta: { color: 'red' } })
    result.labels.push('y')
    expect(labels).toEqual(['x'])
  })
})
