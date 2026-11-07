import { describe, expect, it } from 'vitest'
import type { XdebugBreakpoint, XdebugSavedBreakpoint } from '../types'
import { breakpointRows, filePath, gutterMarks, parseBreakpointInput, sameFile } from './xdebug-breakpoints'

const F = 'file:///app/src/Services/CartService.php'
const saved = (over: Partial<XdebugSavedBreakpoint> = {}): XdebugSavedBreakpoint => ({
  id: 1, type: 'line', file: F, line: 40, enabled: true, source: 'ui', created_at: '2026-11-07T10:00:00Z', ...over
})
const inSession = (over: Partial<XdebugBreakpoint> = {}): XdebugBreakpoint => ({
  id: 1, type: 'line', state: 'resolved', file: F, line: 40, hit_count: 0, ...over
})

describe('parseBreakpointInput', () => {
  it('reads path:line as a line breakpoint', () => {
    expect(parseBreakpointInput(' /app/src/Cart.php:43 ')).toEqual({ draft: { type: 'line', file: '/app/src/Cart.php', line: 43 } })
  })

  it('keeps a Windows drive colon in the path', () => {
    expect(parseBreakpointInput('C:\\app\\x.php:7')).toEqual({ draft: { type: 'line', file: 'C:\\app\\x.php', line: 7 } })
  })

  it('reads a class name as an exception breakpoint, without the leading backslash Xdebug does not match', () => {
    expect(parseBreakpointInput('\\RuntimeException')).toEqual({ draft: { type: 'exception', exception: 'RuntimeException' } })
    expect(parseBreakpointInput('\\App\\Error\\Boom')).toEqual({ draft: { type: 'exception', exception: 'App\\Error\\Boom' } })
    expect(parseBreakpointInput('*')).toEqual({ draft: { type: 'exception', exception: '*' } })
  })

  it('asks for a line number when a path has none', () => {
    for (const raw of ['/app/src/Cart.php', '/app/src/Cart.php:', '/app/src/Cart.php:0', 'Cart.php:abc']) {
      expect(parseBreakpointInput(raw).error).toMatch(/line number after the colon/)
    }
  })

  it('refuses text that is neither', () => {
    expect(parseBreakpointInput('not a thing').error).toMatch(/path:line/)
  })

  it('returns nothing for an empty input', () => {
    expect(parseBreakpointInput('   ')).toEqual({})
  })
})

describe('filePath', () => {
  it('drops the file:// scheme, keeping the drive on Windows', () => {
    expect(filePath(F)).toBe('/app/src/Services/CartService.php')
    expect(filePath('file:///C:/app/x.php')).toBe('C:/app/x.php')
  })
})

describe('sameFile', () => {
  it('matches one file written with %20 or a space, c: or C:', () => {
    expect(sameFile('file:///app/my%20dir/x.php', 'file:///app/my dir/x.php')).toBe(true)
    expect(sameFile('file:///c:/app/x.php', 'file:///C:/app/x.php')).toBe(true)
    expect(sameFile('file:///app/x.php', 'file:///app/y.php')).toBe(false)
    expect(sameFile(undefined, 'file:///app/x.php')).toBe(false)
  })
})

describe('gutterMarks across spellings', () => {
  it('marks a line saved as file:///c:/… in Xdebug\'s file:///C:/…', () => {
    expect(gutterMarks('file:///C:/app/x.php', [saved({ file: 'file:///c:/app/x.php', line: 3 })], [], false).get(3)).toBe('on')
  })
})

describe('breakpointRows', () => {
  it('adds the session state, hits and the moved line for a session driven here', () => {
    const rows = breakpointRows([saved({ line: 22 })], [inSession({ line: 22, resolved_line: 24, hit_count: 2 })], true)
    expect(rows[0]).toMatchObject({ state: 'resolved', hits: 2, movedTo: 24 })
  })

  it('ignores session data when the session is not driven here', () => {
    const rows = breakpointRows([saved()], [inSession({ hit_count: 3 })], false)
    expect(rows[0]).toMatchObject({ state: undefined, hits: 0, movedTo: undefined })
  })

  it('does not call a breakpoint moved when it stays on its line', () => {
    expect(breakpointRows([saved()], [inSession({ resolved_line: 40 })], true)[0].movedTo).toBeUndefined()
  })
})

describe('gutterMarks', () => {
  it('marks on, conditional, off and not-resolved lines of one file', () => {
    const marks = gutterMarks(F, [
      saved({ id: 1, line: 40 }),
      saved({ id: 2, line: 43, condition: '$a > 1' }),
      saved({ id: 3, line: 31, enabled: false }),
      saved({ id: 4, line: 22 }),
      saved({ id: 5, file: 'file:///other.php', line: 5 }),
      saved({ id: 6, type: 'exception', file: undefined, line: undefined, exception: '\\RuntimeException' })
    ], [inSession({ id: 4, line: 22, state: 'unresolved' })], true)
    expect(Object.fromEntries(marks)).toEqual({ 40: 'on', 43: 'cond', 31: 'off', 22: 'unres' })
  })

  it('shows a conditional breakpoint skipped with eval off as not resolved', () => {
    const marks = gutterMarks(F, [saved({ condition: '$a' })], [inSession({ state: 'skipped' })], true)
    expect(marks.get(40)).toBe('unres')
  })

  it('has no marks without a file', () => {
    expect(gutterMarks(undefined, [saved()], [], true).size).toBe(0)
  })
})
