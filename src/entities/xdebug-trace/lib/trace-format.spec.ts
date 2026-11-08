import { describe, expect, it } from 'vitest'
import { formatMemoryDelta, formatSeconds, traceTitle } from './trace-format'
import { shortPath } from './trace-path'

describe('formatSeconds', () => {
  it.each([
    [0, '0 ms'],
    [0.0000042, '4.2 µs'],
    [0.000999, '999 µs'],
    [0.0123, '12.3 ms'],
    [0.5, '500 ms'],
    [1.2345, '1.23 s'],
    [75, '75.0 s'],
  ])('%s s → %s', (seconds, text) => {
    expect(formatSeconds(seconds)).toBe(text)
  })
})

describe('formatMemoryDelta', () => {
  it('signs growth and release, and says nothing changed', () => {
    expect(formatMemoryDelta(2048)).toBe('+2.0 Kb')
    expect(formatMemoryDelta(-512)).toBe('−512 B')
    expect(formatMemoryDelta(0)).toBe('0 B')
  })
})

describe('traceTitle', () => {
  const trace = { name: '', url: '', main: '/app/public/index.php' }

  it('prefers the request, then the name, then the script', () => {
    expect(traceTitle({ ...trace, url: 'GET /users', name: 'users list' })).toBe('GET /users')
    expect(traceTitle({ ...trace, name: 'users list' })).toBe('users list')
    expect(traceTitle(trace)).toBe('/app/public/index.php')
    expect(traceTitle({ ...trace, main: '' })).toBe('Xdebug trace')
  })
})

describe('shortPath', () => {
  it('keeps the last two parts of a long path', () => {
    expect(shortPath('/var/www/app/Http/Kernel.php')).toBe('…/Http/Kernel.php')
  })
  it('keeps a short path as it is', () => {
    expect(shortPath('/index.php')).toBe('/index.php')
    expect(shortPath('')).toBe('')
  })
})
