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
      ['Errors & performance', ['sentry', 'profiler', 'inspector', 'csp']],
      ['Dumps', ['ray', 'http-dump', 'var-dump', 'xdebug-trace']],
      ['Mail & logs', ['smtp', 'sms', 'broadcast', 'monolog']],
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
    expect(addr.broadcast).toBe('http://localhost:8000/apps/…/events')
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

  it('no Mock server card when the http-dump module is off: the server serves mocks from it', () => {
    const tools = (events: string[]) =>
      buildChannelGroups(input({ availableEvents: events }))
        .find((g) => g.id === 'tools')!
        .channels.map((c) => c.id)
    expect(tools(ALL_EVENT_TYPES_LIST.filter((t) => t !== 'http-dump'))).toEqual(['http-proxy', 'xdebug'])
    expect(tools(ALL_EVENT_TYPES_LIST)).toContain('mock-server')
  })

  it('drops a group with no cards', () => {
    const groups = buildChannelGroups(input({ hidden: ['smtp', 'sms', 'broadcast', 'monolog'] }))
    expect(groups.map((g) => g.title)).not.toContain('Mail & logs')
  })

  it('has no card for a module the server has off', () => {
    const all = buildChannelGroups(
      input({ availableEvents: ALL_EVENT_TYPES_LIST.filter((t) => t !== 'var-dump'), off: new Set(['vardumper_port']) })
    ).flatMap((g) => g.channels)
    expect(all.map((c) => c.id)).not.toContain('var-dump')
  })

  it('a module on whose listener did not start: off, naming no setting that would not help', () => {
    const all = buildChannelGroups(input({ off: new Set(['vardumper_port', 'smtp_port', 'xdebug_port']) })).flatMap(
      (g) => g.channels
    )
    for (const id of ['var-dump', 'smtp']) {
      const c = all.find((x) => x.id === id)!
      expect(c.state).toBe('off')
      expect(c.offHint).toBe('Its listener is not running on this server')
      expect(c.offHint).not.toMatch(/_ADDR/)
    }
    const xdebug = all.find((c) => c.id === 'xdebug')!
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
    // the channel console is its own page (#6614)
    expect(to.broadcast).toBe('/broadcast')
    expect(to.smtp).toEqual({ name: 'event-list', params: { type: 'smtp' } })
    expect(to['mock-server']).toEqual({ name: 'mock-server' })
    expect(to['http-proxy']).toBeNull()
    expect(all.filter((c) => c.eventType).map((c) => c.id)).toHaveLength(12)
  })
})
