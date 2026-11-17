import { afterEach, describe, expect, it, vi } from 'vitest'
import { availableStatus } from '../mocks'
import { UpdateApiError, createUpdateRequests } from './update-requests'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('createUpdateRequests', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the status with the auth token', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(availableStatus)))
    vi.stubGlobal('fetch', fetchMock)

    const status = await createUpdateRequests(() => 'secret', 'http://x').getStatus()

    expect(status).toEqual(availableStatus)
    expect(fetchMock).toHaveBeenCalledWith('http://x/api/update', expect.objectContaining({
      headers: expect.objectContaining({ 'X-Auth-Token': 'secret' }),
    }))
  })

  // An older server has no /api/update: the feature hides itself.
  it('answers null when the server does not know /api/update', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('404 page not found', { status: 404 }))))

    await expect(createUpdateRequests(() => '', 'http://x').getStatus()).resolves.toBeNull()
  })

  it('throws with the status on other errors', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ message: 'nope', code: 401 }, 401))))

    await expect(createUpdateRequests(() => '', 'http://x').getStatus()).rejects.toMatchObject({
      status: 401,
      message: 'nope',
    })
  })

  it('asks for a check as JSON', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(availableStatus)))
    vi.stubGlobal('fetch', fetchMock)

    await createUpdateRequests(() => 't', 'http://x').check()

    expect(fetchMock).toHaveBeenCalledWith('http://x/api/update/check', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-Auth-Token': 't' }),
    }))
  })

  it('reports a too-early check with the wait the server asks for', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ message: 'Too many checks', code: 429, retry_after: 42 }, 429))))

    const error = await createUpdateRequests(() => '', 'http://x').check().catch((e) => e)

    expect(error).toBeInstanceOf(UpdateApiError)
    expect(error).toMatchObject({ status: 429, retryAfter: 42, message: 'Too many checks' })
  })

  it('starts an update of the given version', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(availableStatus, 202)))
    vi.stubGlobal('fetch', fetchMock)

    await createUpdateRequests(() => '', 'http://x').start('2.10.0')

    expect(fetchMock).toHaveBeenCalledWith('http://x/api/update', expect.objectContaining({
      method: 'POST',
      body: '{"version":"2.10.0"}',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }))
  })

  it('keeps the message of a refused start', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ message: 'An update is already running', code: 409 }, 409))))

    await expect(createUpdateRequests(() => '', 'http://x').start('2.10.0')).rejects.toMatchObject({
      status: 409,
      message: 'An update is already running',
    })
  })

  it('falls back to the status when the error has no body', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 500 }))))

    await expect(createUpdateRequests(() => '', 'http://x').start('2.10.0')).rejects.toMatchObject({
      status: 500,
      message: 'The server answered 500.',
    })
  })
})
