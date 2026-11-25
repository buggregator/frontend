import { describe, expect, it } from 'vitest'
import { HTML_UNTITLED, htmlSize, htmlTitle } from './html-event'

describe('htmlTitle', () => {
  it.each([
    [{ title: 'Nightly report' }, 'Nightly report'],
    [{ title: '  ' }, HTML_UNTITLED],
    [{}, HTML_UNTITLED]
  ])('%j → %s', (payload, title) => {
    expect(htmlTitle(payload)).toBe(title)
  })
})

describe('htmlSize', () => {
  it('formats the byte count', () => {
    expect(htmlSize({ size: 2048 })).toBe('2.0 Kb')
  })

  it.each([[{}], [{ size: 0 }]])('is empty without a size: %j', (payload) => {
    expect(htmlSize(payload)).toBe('')
  })
})
