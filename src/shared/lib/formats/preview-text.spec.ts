import { describe, expect, it } from 'vitest'
import { previewText } from './preview-text'

describe('previewText', () => {
  it('folds whitespace into one line', () => {
    expect(previewText('  a\n\n b\tc ')).toBe('a b c')
  })

  it('cuts after 120 characters with an ellipsis', () => {
    expect(previewText('x'.repeat(121))).toBe(`${'x'.repeat(120)}...`)
    expect(previewText('x'.repeat(120))).toBe('x'.repeat(120))
  })

  it('gives an empty string for no text', () => {
    expect(previewText(undefined)).toBe('')
    expect(previewText(null)).toBe('')
  })
})
