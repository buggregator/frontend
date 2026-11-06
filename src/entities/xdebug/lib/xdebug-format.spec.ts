import { describe, expect, it } from 'vitest'
import type { XdebugSession, XdebugVar } from '../types'
import {
  changedNames,
  closedReasonText,
  flattenValues,
  foldFrames,
  highlightPhp,
  isLive,
  sessionTitle,
  shortFile,
  splitPath,
  varSummary
} from './xdebug-format'

const session = (over: Partial<XdebugSession> = {}): XdebugSession => ({
  id: '1',
  state: 'break',
  ide_connected: true,
  agent_calls: 0,
  ...over
})

describe('xdebug-format', () => {
  it('drops the file:// scheme and keeps the name', () => {
    expect(shortFile('file:///app/src/CartService.php')).toBe('CartService.php')
    expect(splitPath('file:///app/src/CartService.php')).toEqual({ dir: '/app/src/', name: 'CartService.php' })
    expect(shortFile(undefined)).toBe('')
  })

  it('titles a session by its target, else the entry file, else its id', () => {
    expect(sessionTitle(session({ target: 'GET /checkout?step=2' }))).toBe('GET /checkout?step=2')
    expect(sessionTitle(session({ entry_file: 'file:///app/t.php' }))).toBe('t.php')
    expect(sessionTitle(session())).toBe('Session #1')
  })

  it('tells a live session from a tombstone', () => {
    expect(isLive(session({ state: 'running' }))).toBe(true)
    expect(isLive(session({ state: 'detached', closed_reason: 'ide_closed' }))).toBe(false)
    expect(isLive(session({ state: 'stopped' }))).toBe(false)
  })

  it('explains every close reason with the IDE address', () => {
    expect(closedReasonText('ide_unreachable', '127.0.0.1:9004')).toContain('127.0.0.1:9004')
    expect(closedReasonText('ide_closed', 'x')).toMatch(/IDE/)
    expect(closedReasonText('engine_closed', 'x')).toMatch(/script/i)
    expect(closedReasonText('stopped', 'x')).toMatch(/stopped/i)
  })

  it('folds runs of vendor frames, keeping the selected one visible', () => {
    const f = (level: number, vendor: boolean) => ({ level, where: `f${level}`, file: '', line: 1, vendor })
    const frames = [f(0, false), f(1, true), f(2, true), f(3, false), f(4, true)]

    expect(foldFrames(frames, 0, new Set()).map((r) => (r.kind === 'group' ? `g${r.count}` : r.frame.level)))
      .toEqual([0, 'g2', 3, 'g1'])
    expect(foldFrames(frames, 2, new Set()).map((r) => (r.kind === 'group' ? `g${r.count}` : r.frame.level)))
      .toEqual([0, 1, 2, 3, 'g1'])
    expect(foldFrames(frames, 0, new Set([1])).map((r) => (r.kind === 'group' ? `g${r.count}` : r.frame.level)))
      .toEqual([0, 1, 2, 3, 'g1'])
  })

  it('summarises a variable for its row', () => {
    const v = (over: Partial<XdebugVar>): XdebugVar => ({ name: '$a', fullname: '$a', type: 'int', ...over })
    expect(varSummary(v({ type: 'object', class: 'App\\Cart', numchildren: 4 }))).toEqual({ text: 'Cart', count: '{4}' })
    expect(varSummary(v({ type: 'array', numchildren: 3 }))).toEqual({ text: 'array', count: '(3)' })
    expect(varSummary(v({ type: 'string', value: 'hi' }))).toEqual({ text: '"hi"', count: '' })
    expect(varSummary(v({ type: 'null' }))).toEqual({ text: 'null', count: '' })
    expect(varSummary(v({ type: 'uninitialized' }))).toEqual({ text: 'uninitialized', count: '' })
    expect(varSummary(v({ type: 'bool', value: '1' }))).toEqual({ text: 'true', count: '' })
  })

  it('finds values that changed since the previous pause', () => {
    const before = flattenValues([
      { name: '$a', fullname: '$a', type: 'int', value: '1' },
      { name: '$b', fullname: '$b', type: 'string', value: 'x' }
    ])
    const after = flattenValues([
      { name: '$a', fullname: '$a', type: 'int', value: '2' },
      { name: '$b', fullname: '$b', type: 'string', value: 'x' },
      { name: '$c', fullname: '$c', type: 'int', value: '3' }
    ])
    expect([...changedNames(before, after)].sort()).toEqual(['$a', '$c'])
    expect(changedNames(null, after).size).toBe(0)
  })
})

describe('highlightPhp', () => {
  const kinds = (line: string) => highlightPhp(line).map(({ kind, text }) => `${kind}:${text}`)

  it('marks keywords, variables, strings, numbers and comments', () => {
    expect(kinds('return $a + 15; // done')).toEqual(['k:return', ': ', 'v:$a', ': + ', 'n:15', ':; ', 'c:// done'])
    expect(kinds("$s = 'it''s';")).toEqual(['v:$s', ': = ', "s:'it'", "s:'s'", ':;'])
  })

  it('keeps the whole line text', () => {
    const line = '    if ($discount > 0 && $subtotal >= self::MIN) {'
    expect(highlightPhp(line).map((t) => t.text).join('')).toBe(line)
  })
})
