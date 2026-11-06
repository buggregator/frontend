import { describe, expect, it } from 'vitest'
import { hasEntries } from './has-entries'

describe('hasEntries', () => {
  it.each([
    [{ uid: 'uid: 156865' }, true],
    [['a'], true],
    [{}, false],
    [[], false],
    [null, false],
    [undefined, false],
    ['text', false],
  ])('%j -> %s', (value, expected) => {
    expect(hasEntries(value)).toBe(expected)
  })
})
