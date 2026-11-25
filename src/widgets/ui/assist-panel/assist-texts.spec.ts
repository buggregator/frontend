import { describe, expect, it } from 'vitest'
import { agoOf, initialsOf, splitTitle, suggestionsFor } from './assist-texts'

describe('assist texts', () => {
  it('initials of the agent, any script', () => {
    expect(initialsOf('server-lid')).toBe('SL')
    expect(initialsOf('лид')).toBe('ЛИ')
    expect(initialsOf('')).toBe('A')
  })

  it('splits a context title into kind and subject', () => {
    expect(splitTitle('Sentry error · OrderError: x')).toEqual({ kind: 'Sentry error', subject: 'OrderError: x' })
    expect(splitTitle('Sentry exceptions list')).toEqual({ kind: '', subject: 'Sentry exceptions list' })
  })

  it('ready questions: the page’s own, else by kind', () => {
    expect(suggestionsFor({ kind: 'page', key: '/', title: 'x', suggestions: ['a', 'b', 'c', 'd'] })).toEqual(['a', 'b', 'c'])
    expect(suggestionsFor({ kind: 'event', key: 'u', title: 'Sentry error · x' })[0]).toBe('Why does this fail?')
    expect(suggestionsFor({ kind: 'event', key: 'u', title: 'Monolog · x' })[0]).toBe('What does this event tell me?')
  })

  it('how long ago', () => {
    const now = Date.parse('2026-11-25T12:00:00Z')
    expect(agoOf('2026-11-25T11:59:50Z', now)).toBe('now')
    expect(agoOf('2026-11-25T11:55:00Z', now)).toBe('5 min')
    expect(agoOf('2026-11-25T10:00:00Z', now)).toBe('2 h')
    expect(agoOf('2026-11-24T12:00:00Z', now)).toBe('yesterday')
    expect(agoOf('2026-11-22T12:00:00Z', now)).toBe('3 days')
  })
})
