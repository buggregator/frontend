import { describe, expect, it } from 'vitest'
import { EventTypes, isEventType } from './events'

// Audit 1.12: ServerEvent.type is a known EventType or any other string.
describe('isEventType', () => {
  it('knows every EventTypes value', () => {
    for (const type of Object.values(EventTypes)) expect(isEventType(type)).toBe(true)
  })

  it('refuses a type this UI does not know, and non-strings', () => {
    expect(isEventType('xdebug-future')).toBe(false)
    expect(isEventType(undefined)).toBe(false)
    expect(isEventType(1)).toBe(false)
  })
})
