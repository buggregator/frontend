import { describe, expect, it, vi } from 'vitest'
import type { XdebugSession } from '../types'
import { TOMBSTONE_TTL_MS, useXdebugSessions } from './use-xdebug-sessions'

const s = (id: string, over: Partial<XdebugSession> = {}): XdebugSession =>
  ({ id, state: 'break', ide_connected: true, agent_calls: 0, started_at: `2026-11-06T12:00:0${id}Z`, ...over })

const makeApi = (enabled = true, list: XdebugSession[] = []) => ({
  getConfig: vi.fn(async () => ({ enabled, addr: '127.0.0.1:9003', ide_addr: '127.0.0.1:9004', allow_eval: false })),
  getSessions: vi.fn(async () => list),
  dismissSession: vi.fn(async () => undefined)
})

describe('useXdebugSessions', () => {
  it('does not ask for sessions when the module is off', async () => {
    const api = makeApi(false)
    const list = useXdebugSessions(api)
    await list.load()

    expect(list.config.value?.enabled).toBe(false)
    expect(api.getSessions).not.toHaveBeenCalled()
    expect(list.state.value).toBe('ready')
  })

  it('lists live sessions newest first, tombstones after them', async () => {
    const list = useXdebugSessions(makeApi(true, [
      s('1', { state: 'detached', closed_reason: 'ide_unreachable', closed_at: new Date().toISOString() }),
      s('2', { state: 'running' }),
      s('3')
    ]))
    await list.load()

    expect(list.sessions.value.map((x) => x.id)).toEqual(['3', '2', '1'])
  })

  it('follows the channel: created, status, closed, agent calls', async () => {
    const list = useXdebugSessions(makeApi())
    await list.load()

    list.apply({ event: 'session.created', data: s('7', { state: 'starting' }) })
    list.apply({ event: 'session.status', data: { id: '7', state: 'break', file: 'file:///a.php', line: 3, kind: 'http', target: 'GET /' } })
    list.apply({ event: 'agent.call', data: { seq: 1, session_id: '7', at: '', tool: 't', args: '', ok: true, result_summary: '', duration_ms: 1 } })

    expect(list.sessions.value[0]).toMatchObject({ state: 'break', last_line: 3, target: 'GET /', agent_calls: 1 })

    list.apply({ event: 'session.closed', data: { id: '7', reason: 'ide_closed', state: 'detached' } })
    expect(list.sessions.value[0]).toMatchObject({ state: 'detached', closed_reason: 'ide_closed', ide_connected: false })
  })

  it('hides a tombstone after ten minutes and on dismiss', async () => {
    const old = new Date(Date.now() - TOMBSTONE_TTL_MS - 1000).toISOString()
    const api = makeApi(true, [s('1', { state: 'stopped', closed_reason: 'stopped', closed_at: old }), s('2', { state: 'stopped', closed_reason: 'stopped', closed_at: new Date().toISOString() })])
    const list = useXdebugSessions(api)
    await list.load()
    expect(list.sessions.value.map((x) => x.id)).toEqual(['2'])

    await list.dismiss('2')
    expect(api.dismissSession).toHaveBeenCalledWith('2')
    expect(list.sessions.value).toEqual([])
  })
})
