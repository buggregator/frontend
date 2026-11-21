import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REST_API_URL } from '@/shared/lib/io'
import { useProfileStore } from '@/shared/stores'
import { ReleaseError, parseRecipients, relayAddress, useSmtpRelay } from './smtp-relay'

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))

describe('parseRecipients', () => {
  it('splits on commas, semicolons, spaces and new lines, drops repeats', () => {
    expect(parseRecipients(' a@ex.com, b@ex.com;c@ex.com\nA@EX.com  ')).toEqual({
      valid: ['a@ex.com', 'b@ex.com', 'c@ex.com'],
      invalid: []
    })
  })

  it('keeps what is not an address apart', () => {
    expect(parseRecipients('me@ex.com, nope, x@y')).toEqual({ valid: ['me@ex.com'], invalid: ['nope', 'x@y'] })
  })

  it('gives nothing for an empty field', () => {
    expect(parseRecipients('  ,; ')).toEqual({ valid: [], invalid: [] })
  })
})

describe('relayAddress', () => {
  it('names host, port, TLS and login', () => {
    expect(relayAddress({ enabled: true, configured: true, host: 'smtp.ex.com', port: 587, tls: 'starttls', auth: true }))
      .toBe('smtp.ex.com:587 · STARTTLS · with login')
    expect(relayAddress({ enabled: true, configured: true, host: 'mailpit', port: 1025, tls: 'none', auth: false }))
      .toBe('mailpit:1025 · no TLS · no login')
  })
})

describe('useSmtpRelay', () => {
  const fetchMock = vi.fn(() => json({ enabled: true, configured: true }))

  beforeEach(() => {
    setActivePinia(createPinia())
    useProfileStore().setToken('t0k')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const call = (i = 0) => {
    const [url, init = {}] = fetchMock.mock.calls[i] as unknown as [string, RequestInit?]
    return { url, method: init.method ?? 'GET', headers: init.headers as Record<string, string>, body: init.body }
  }

  it('loads the relay once with the auth token', async () => {
    const relay = useSmtpRelay()
    await relay.load(true)
    await relay.load()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(call()).toMatchObject({ url: `${REST_API_URL}/api/smtp/relay`, method: 'GET', headers: { 'X-Auth-Token': 't0k' } })
    expect(relay.state.value).toBe('ready')
    expect(relay.info.value).toEqual({ enabled: true, configured: true })
  })

  it('is unavailable on an older server without the route', async () => {
    fetchMock.mockImplementationOnce(() => json({ code: 'not_found' }, 404))
    const relay = useSmtpRelay()
    await relay.load(true)

    expect(relay.state.value).toBe('unavailable')
    expect(relay.info.value).toBeNull()
  })

  it('posts the addresses and the rewrite flag, returns what the relay took', async () => {
    fetchMock.mockImplementationOnce(() => json({ status: true, to: ['me@ex.com'] }))
    const to = await useSmtpRelay().release('a b', ['Me@ex.com'], true)

    expect(to).toEqual(['me@ex.com'])
    expect(call()).toMatchObject({
      url: `${REST_API_URL}/api/smtp/release/a%20b`,
      method: 'POST',
      headers: { 'X-Auth-Token': 't0k', 'Content-Type': 'application/json' }
    })
    expect(JSON.parse(String(call().body))).toEqual({ to: ['Me@ex.com'], rewrite_to: true })
  })

  it('throws the server message with its status and code', async () => {
    fetchMock.mockImplementationOnce(() => json({ code: 'forbidden_recipient', message: 'x@ex.com is not allowed' }, 422))

    const err = await useSmtpRelay().release('id', ['x@ex.com'], false).catch((e) => e)
    expect(err).toBeInstanceOf(ReleaseError)
    expect(err).toMatchObject({ message: 'x@ex.com is not allowed', status: 422, code: 'forbidden_recipient' })
  })

  it('says the status when the answer has no message, and names a network failure', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response('bad gateway', { status: 502 })))
    await expect(useSmtpRelay().release('id', ['a@ex.com'], false)).rejects.toThrow('The server answered 502.')

    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(useSmtpRelay().release('id', ['a@ex.com'], false)).rejects.toMatchObject({ code: 'network' })
  })
})
