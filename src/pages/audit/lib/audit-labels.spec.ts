import { describe, expect, it } from 'vitest'
import { auditActionLabel, auditTime, isAuditFailure, isAuditRoute } from './audit-labels'

describe('audit labels', () => {
  it('names known actions in plain words, keeps routes as they are', () => {
    expect(auditActionLabel('login_denied')).toBe('Sign-in refused')
    expect(auditActionLabel('POST /api/mocks')).toBe('POST /api/mocks')
    expect(isAuditRoute('POST /api/mocks')).toBe(true)
    expect(isAuditRoute('logout')).toBe(false)
  })

  it('reads the server time, and keeps text it cannot read', () => {
    expect(auditTime('2026-11-22T10:00:00.000000Z')).toMatch(/2026/)
    expect(auditTime('soon')).toBe('soon')
  })

  it('marks refused requests', () => {
    expect(isAuditFailure({ status: 403 })).toBe(true)
    expect(isAuditFailure({ status: 204 })).toBe(false)
  })
})
