import { describe, expect, it } from 'vitest'
import {
  broadcastEncryptedMock,
  broadcastInvalidJsonMock,
  broadcastMultiChannelMock,
  broadcastUpstreamDownMock
} from '../mocks'
import { formatBytes, formatClock } from './format'
import { jsonLines } from './json-lines'
import {
  broadcastProblems,
  buildBroadcastCurl,
  channelKindLabel,
  channelShortName,
  hasJsonData,
  isDataCut
} from './payload'
import { diffPayload } from './payload-diff'

describe('broadcast payload helpers', () => {
  it('tells a cut preview from a full event', () => {
    const p = broadcastMultiChannelMock.payload
    expect(isDataCut(p)).toBe(false)
    expect(isDataCut({ ...p, size: p.size + 10 })).toBe(true)
    expect(hasJsonData(p)).toBe(true)
    expect(hasJsonData(broadcastInvalidJsonMock.payload)).toBe(false)
  })

  it('turns warnings, encryption and a failed forward into problems with a tone', () => {
    expect(broadcastProblems(broadcastInvalidJsonMock.payload).map((p) => p.tone)).toEqual(['error', 'warning'])
    expect(broadcastProblems(broadcastEncryptedMock.payload)).toEqual([
      { tone: 'info', text: expect.stringContaining('Encrypted channel') }
    ])
    expect(broadcastProblems(broadcastUpstreamDownMock.payload)[0]).toMatchObject({
      tone: 'error',
      text: expect.stringContaining('connection refused')
    })
    expect(broadcastProblems(broadcastMultiChannelMock.payload)).toEqual([])
  })

  it('labels a channel by its kind in words and drops the prefix', () => {
    expect(channelKindLabel('public')).toBe('#')
    expect(channelKindLabel('presence')).toBe('presence')
    expect(channelShortName('private-encrypted-payments.42')).toBe('payments.42')
    expect(channelShortName('presence-room.1')).toBe('room.1')
    expect(channelShortName('admin')).toBe('admin')
  })

  it('builds a curl that sends the event again', () => {
    const curl = buildBroadcastCurl('http://127.0.0.1:8000/', broadcastMultiChannelMock.payload)
    expect(curl).toContain("'http://127.0.0.1:8000/apps/shop/events?auth_key=local&auth_signature=resent'")
    expect(curl).toContain('"name":"OrderShipped"')
  })

  it('formats sizes and times', () => {
    expect(formatBytes(188)).toBe('188 B')
    expect(formatBytes(14540)).toBe('14.2 KB')
    const t = new Date(2026, 10, 21, 14, 2, 11, 482).getTime() / 1000
    expect(formatClock(t)).toBe('14:02:11.482')
    expect(formatClock(0)).toBe('')
  })
})

describe('jsonLines', () => {
  it('prints JSON lines and marks changed and added values', () => {
    const before = { order: { status: 'packed' }, list: [1] }
    const after = { order: { status: null }, list: [1, 2] }
    const lines = jsonLines(after, diffPayload(before, after))
    const text = lines.map((l) => '  '.repeat(l.indent) + l.tokens.map((t) => t.text).join(''))
    expect(text).toEqual(['{', '  "order": {', '    "status": null', '  },', '  "list": [', '    1,', '    2', '  ]', '}'])
    expect(lines[2]).toMatchObject({ mark: '~', was: '"packed"' })
    expect(lines[6]).toMatchObject({ mark: '+' })
    expect(lines.filter((l) => l.mark)).toHaveLength(2)
  })

  it('prints a scalar and empty containers on one line', () => {
    expect(jsonLines('x').map((l) => l.tokens)).toEqual([[{ kind: 'str', text: '"x"' }]])
    expect(jsonLines({ a: [], b: {} }).map((l) => l.tokens.map((t) => t.text).join(''))).toEqual([
      '{',
      '"a": [],',
      '"b": {}',
      '}'
    ])
  })
})
