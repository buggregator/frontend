import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSettingsRequests } from './settings-requests'

describe('createSettingsRequests', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads the saved settings out of the data envelope, with the token', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{"data":{"theme":"dark"}}')))
    vi.stubGlobal('fetch', fetchMock)

    expect(await createSettingsRequests(() => 'tok', 'http://h').get()).toEqual({ theme: 'dark' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://h/api/me/settings')
    expect((init.headers as Record<string, string>)['X-Auth-Token']).toBe('tok')
  })

  it('writes changes as JSON with PUT', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{"data":{}}')))
    vi.stubGlobal('fetch', fetchMock)

    await createSettingsRequests(() => 'tok', 'http://h').put({ theme: 'light', period: null })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe('PUT')
    expect(init.body).toBe('{"theme":"light","period":null}')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('fails with the status when the server refuses', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{"message":"too big"}', { status: 413 }))))

    await expect(createSettingsRequests(() => 'tok', 'http://h').put({ a: 'b' })).rejects.toMatchObject({ status: 413 })
  })

  it('reads an answer without settings as none', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('<html>'))))

    expect(await createSettingsRequests(() => 'tok', 'http://h').get()).toEqual({})
  })
})
