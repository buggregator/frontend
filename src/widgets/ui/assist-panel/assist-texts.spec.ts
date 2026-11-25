import { describe, expect, it } from 'vitest'
import { agoOf, emptyAbilities, initialsOf, splitTitle, suggestionsFor } from './assist-texts'

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

  // Without MCP the agent has one event: nothing about other events or history.
  const OTHER_EVENTS = /similar|when did|how often|when it started/i
  const error = { kind: 'event' as const, key: 'u', title: 'Sentry error · x' }
  const log = { kind: 'event' as const, key: 'u', title: 'Monolog · x' }

  it.each([
    ['error', error],
    ['other event', log]
  ])('MCP off, %s: offers only what the sent event allows', (_, ctx) => {
    for (const t of [...suggestionsFor(ctx), ...emptyAbilities(ctx)]) expect(t).not.toMatch(OTHER_EVENTS)
    expect(suggestionsFor(ctx)).toHaveLength(3)
    expect(emptyAbilities(ctx)).toHaveLength(3)
  })

  it.each([
    ['error', error, 'When did this start, and how often?', 'Find similar events and when it started'],
    ['other event', log, 'Find similar events', 'Find similar events']
  ])('MCP on and read-only, %s: may look up other events', (_, ctx, question, ability) => {
    expect(suggestionsFor(ctx, true)).toContain(question)
    expect(emptyAbilities(ctx, true)).toContain(ability)
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
