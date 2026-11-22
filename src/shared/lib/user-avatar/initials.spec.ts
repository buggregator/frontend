import { describe, expect, it } from 'vitest'
import { userInitials } from './initials'

describe('userInitials', () => {
  it('takes the first letters of the first two words of a name', () => {
    expect(userInitials('Ann Smith')).toBe('AS')
    expect(userInitials('  maria  de la cruz ')).toBe('MD')
  })

  it('reads an email by its local part, split at dots, dashes and underscores', () => {
    expect(userInitials('john.doe@example.test')).toBe('JD')
    expect(userInitials('ops_team@example.test')).toBe('OT')
    expect(userInitials('admin@example.test')).toBe('A')
  })

  it('keeps letters outside Latin and whole surrogate pairs', () => {
    expect(userInitials('анна петрова')).toBe('АП')
    expect(userInitials('𝒜lex')).toBe('𝒜')
  })

  it('falls back to the next value, then to «?»', () => {
    expect(userInitials('', 'bob@example.test')).toBe('B')
    expect(userInitials(undefined, null)).toBe('?')
  })
})
