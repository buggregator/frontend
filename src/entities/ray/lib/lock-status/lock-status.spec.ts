import { describe, expect, it } from 'vitest'
import { lockStatusFromReply } from './lock-status'

describe('lockStatusFromReply', () => {
  it('takes the state the server reports', () => {
    expect(lockStatusFromReply({ code: 200, data: { status: true, state: 'stopped' } }, 'continued')).toBe('stopped')
    expect(lockStatusFromReply({ code: 200, data: { status: true, state: 'continued' } }, 'stopped')).toBe('continued')
  })

  it('falls back to the asked state on a 2xx without one', () => {
    expect(lockStatusFromReply({ code: 200, data: { status: true } }, 'stopped')).toBe('stopped')
    expect(lockStatusFromReply({ code: 200, data: null }, 'continued')).toBe('continued')
  })

  it('reads 404 as a pause the server no longer knows', () => {
    expect(lockStatusFromReply({ code: 404, data: { status: false, error: 'lock not found' } }, 'continued')).toBe('gone')
  })

  it('gives null when the click did not land', () => {
    expect(lockStatusFromReply({ code: 401, data: null }, 'continued')).toBeNull()
    expect(lockStatusFromReply({ code: 500, data: null }, 'stopped')).toBeNull()
    expect(lockStatusFromReply(undefined, 'continued')).toBeNull()
  })
})
