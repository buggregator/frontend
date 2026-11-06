import { describe, expect, it } from 'vitest'
import { delayText, formatJson, methodTone, statusTone, toCurl } from './mock-format'

describe('mock-format', () => {
  it('uses -700 text for light badges', () => {
    expect(methodTone('get')).toContain('text-green-700')
    expect(methodTone('ANY')).toContain('text-gray-700')
    expect(statusTone(404)).toContain('text-amber-700')
    expect(statusTone(502)).toContain('text-red-700')
  })

  it('prints delays', () => {
    expect(delayText(300)).toBe('300 ms')
    expect(delayText(1500)).toBe('1.5 s')
  })

  it('builds a cURL command without hop headers and with quoted body', () => {
    const curl = toCurl('http://localhost:8000', {
      method: 'post', uri: '/mock/orders?x=1', body: `{"a":"it's"}`, query: {},
      headers: { Host: ['localhost:8000'], 'Content-Type': ['application/json'] },
    })
    expect(curl).toBe(
      `curl -X POST 'http://localhost:8000/mock/orders?x=1' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"a":"it'\\''s"}'`
    )
  })

  it('formats JSON or returns null', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatJson('nope')).toBeNull()
  })
})
