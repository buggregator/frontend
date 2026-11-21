import { describe, expect, it } from 'vitest'
import {
  broadcastEncryptedMock,
  broadcastInvalidJsonMock,
  broadcastMultiChannelMock,
  broadcastUpstreamDownMock
} from '../mocks'
import { formatClock } from './format'
import {
  broadcastProblems,
  buildBroadcastCurl,
  channelKindLabel,
  channelShortName,
  hasJsonData,
  isDataCut
} from './payload'
import { jsonShort } from './payload-diff'

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

  it('formats times', () => {
    const t = new Date(2026, 10, 21, 14, 2, 11, 482).getTime() / 1000
    expect(formatClock(t)).toBe('14:02:11.482')
    expect(formatClock(0)).toBe('')
  })
})

describe('jsonShort', () => {
  it('prints a value of the Changes list as JSON, cut to its length', () => {
    expect(jsonShort('packed')).toBe('"packed"')
    expect(jsonShort(null)).toBe('null')
    expect(jsonShort(undefined)).toBe('undefined')
    expect(jsonShort('x'.repeat(100), 10)).toBe(`"${'x'.repeat(8)}…`)
  })
})
