import { describe, expect, it } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  it('copies only the listed keys', () => {
    const source = { file: 'a.php', line_number: 10, hostname: 'h', extra: true }

    expect(pick(source, ['file', 'line_number'])).toEqual({ file: 'a.php', line_number: 10 })
  })

  it('leaves out keys the source does not have', () => {
    const source: { file?: string, hostname?: string } = { file: 'a.php' }
    const result = pick(source, ['file', 'hostname'])

    expect(result).toEqual({ file: 'a.php' })
    expect('hostname' in result).toBe(false)
  })

  it('keeps a key whose value is undefined when the source has it', () => {
    const result = pick({ file: undefined }, ['file'])

    expect('file' in result).toBe(true)
  })

  it('returns an empty object for a missing source', () => {
    expect(pick(undefined as unknown as { a: number }, ['a'])).toEqual({})
  })
})
