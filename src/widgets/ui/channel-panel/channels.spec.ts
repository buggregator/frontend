import { describe, expect, it } from 'vitest'
import { ALL_EVENT_TYPES_LIST, buildChannelGroups, type ChannelInput } from './channels'

const values = {
  host: 'localhost',
  project: 'shop',
  project_js: 'shop',
  http_port: '8000',
  smtp_port: '1025',
  monolog_port: '9913',
  vardumper_port: '9912',
  proxy_port: '8080',
  xdebug_port: '9003'
}

const input = (over: Partial<ChannelInput> = {}): ChannelInput => ({
  availableEvents: ALL_EVENT_TYPES_LIST,
  hidden: [],
  xdebugEnabled: false,
  off: new Set(['xdebug_port']),
  values,
  connected: true,
  ...over
})

const ids = (groups: ReturnType<typeof buildChannelGroups>) =>
  groups.map((g) => [g.title, g.channels.map((c) => c.id)])

describe('buildChannelGroups', () => {
  it('follows the menu groups and order, tools last', () => {
    expect(ids(buildChannelGroups(input()))).toEqual([
      ['Errors & performance', ['sentry', 'profiler', 'inspector']],
      ['Dumps', ['ray', 'http-dump', 'var-dump', 'xdebug-trace']],
      ['Mail & logs', ['smtp', 'sms', 'monolog']],
      ['Tools', ['http-proxy', 'mock-server', 'xdebug']]
    ])
  })

  it('fills each address with this server and project', () => {
    const all = buildChannelGroups(input()).flatMap((g) => g.channels)
    const addr = Object.fromEntries(all.map((c) => [c.id, c.address]))
    expect(addr.sentry).toBe('http://sentry@localhost:8000/shop')
    expect(addr.smtp).toBe('smtp://localhost:1025')
    expect(addr['var-dump']).toBe('tcp://localhost:9912')
    expect(addr.ray).toBe('ray:shop@localhost:8000')
    expect(addr['http-proxy']).toBe('http://localhost:8080')
  })

  it('leaves out sections hidden in Settings › Menu and types the server does not have', () => {
    const groups = buildChannelGroups(
      input({ hidden: ['sms', 'mock-server'], availableEvents: ALL_EVENT_TYPES_LIST.filter((t) => t !== 'ray') })
    )
    const all = groups.flatMap((g) => g.channels).map((c) => c.id)
    expect(all).not.toContain('sms')
    expect(all).not.toContain('mock-server')
    expect(all).not.toContain('ray')
  })

  it('drops a group with no cards', () => {
    const groups = buildChannelGroups(input({ hidden: ['smtp', 'sms', 'monolog'] }))
    expect(groups.map((g) => g.title)).not.toContain('Mail & logs')
  })

  it('marks a listener the server did not open as off, with how to turn it on', () => {
    const all = buildChannelGroups(input({ off: new Set(['smtp_port', 'xdebug_port']) })).flatMap((g) => g.channels)
    const smtp = all.find((c) => c.id === 'smtp')!
    const xdebug = all.find((c) => c.id === 'xdebug')!
    expect(smtp.state).toBe('off')
    expect(smtp.offHint).toBe('Turn it on with SMTP_ADDR')
    expect(xdebug.state).toBe('off')
    expect(xdebug.offHint).toBe('Turn it on with XDEBUG_PROXY_ENABLED')
    expect(xdebug.to).toBeNull()
    expect(all.find((c) => c.id === 'sentry')!.state).toBe('listening')
  })

  it('Xdebug listens when the proxy is enabled', () => {
    const xdebug = buildChannelGroups(input({ xdebugEnabled: true, off: new Set() }))
      .flatMap((g) => g.channels)
      .find((c) => c.id === 'xdebug')!
    expect(xdebug.state).toBe('listening')
    expect(xdebug.to).toEqual({ name: 'xdebug' })
  })

  it('every card is «offline» while the server is not connected', () => {
    const states = new Set(buildChannelGroups(input({ connected: false })).flatMap((g) => g.channels.map((c) => c.state)))
    expect([...states]).toEqual(['offline'])
  })

  it('links event channels to their pages; Sentry to its exceptions; the proxy nowhere', () => {
    const all = buildChannelGroups(input()).flatMap((g) => g.channels)
    const to = Object.fromEntries(all.map((c) => [c.id, c.to]))
    expect(to.sentry).toBe('/sentry/exceptions')
    expect(to.smtp).toEqual({ name: 'event-list', params: { type: 'smtp' } })
    expect(to['mock-server']).toEqual({ name: 'mock-server' })
    expect(to['http-proxy']).toBeNull()
    expect(all.filter((c) => c.eventType).map((c) => c.id)).toHaveLength(10)
  })
})
