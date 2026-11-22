import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuditLog, type AuditEntry } from './use-audit-log'

const entry = (id: number, action = 'login'): AuditEntry => ({
  id,
  at: '2026-11-22T10:00:00.000000Z',
  user_id: 'u1',
  user: 'ann@example.test',
  action,
  target: '',
  status: 200,
  ip: '127.0.0.1',
})

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

// #6772: the audit log for admins (GET /api/audit?limit&before).
describe('createAuditLog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the newest entries with the token', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => json({ data: [entry(3), entry(2)], next_before: 2 }))
    vi.stubGlobal('fetch', fetchMock)
    const log = createAuditLog(() => 'tok', 'http://h', 2)

    await log.load()

    expect(fetchMock.mock.calls[0][0]).toBe('http://h/api/audit?limit=2')
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)['X-Auth-Token']).toBe('tok')
    expect(log.state.value).toBe('ready')
    expect(log.rows.value.map((r) => r.id)).toEqual([3, 2])
    expect(log.hasMore.value).toBe(true)
  })

  it('adds older entries after the last one, and stops at a short page', async () => {
    const fetchMock = vi
      .fn((_url: string) => json({ data: [entry(3), entry(2)], next_before: 2 }))
      .mockImplementationOnce(() => json({ data: [entry(3), entry(2)], next_before: 2 }))
      .mockImplementationOnce(() => json({ data: [entry(1)], next_before: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    const log = createAuditLog(() => 'tok', 'http://h', 2)

    await log.load()
    await log.loadMore()

    expect(fetchMock.mock.calls[1][0]).toBe('http://h/api/audit?limit=2&before=2')
    expect(log.rows.value.map((r) => r.id)).toEqual([3, 2, 1])
    expect(log.hasMore.value).toBe(false)
  })

  it('says when the person is not an admin', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'only admins' }, 403)))
    const log = createAuditLog(() => 'tok', 'http://h')

    await log.load()

    expect(log.state.value).toBe('forbidden')
  })

  it('says why loading failed', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    const log = createAuditLog(() => 'tok', 'http://h')

    await log.load()

    expect(log.state.value).toBe('error')
    expect(log.error.value).toBe('The server cannot be reached.')
  })

  it('keeps the shown entries when an older page fails', async () => {
    const fetchMock = vi
      .fn((_url: string) => json({}, 500))
      .mockImplementationOnce(() => json({ data: [entry(3), entry(2)], next_before: 2 }))
    vi.stubGlobal('fetch', fetchMock)
    const log = createAuditLog(() => 'tok', 'http://h', 2)

    await log.load()
    await log.loadMore()

    expect(log.state.value).toBe('ready')
    expect(log.rows.value).toHaveLength(2)
    expect(log.moreError.value).toBe('The server answered 500.')
  })

  // Review #1: an older server or auth off answers with the web page (200 HTML).
  it('takes an answer that is not a log for an error, not for an empty log', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('<!doctype html>', { status: 200 }))))
    const log = createAuditLog(() => 'tok', 'http://h')

    await log.load()

    expect(log.state.value).toBe('error')
    expect(log.error.value).toBe('The server does not keep an audit log.')
  })
})
