import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { createGetToken, followToken } from './connection-token'

const fakeClient = (state = 'connected') => ({
  state,
  setToken: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
})

// With auth on, the server refuses a WebSocket connect
// without the same token the REST calls send.
describe('createGetToken', () => {
  it('gives the token the store holds when the client asks', async () => {
    const token = ref('')
    const getToken = createGetToken(() => token.value)

    token.value = 'late-token'

    await expect(getToken()).resolves.toBe('late-token')
  })

  it('gives an empty token when there is none (auth off connects as before)', async () => {
    const getToken = createGetToken(() => '')

    await expect(getToken()).resolves.toBe('')
  })
})

describe('followToken', () => {
  it('reconnects with the new token after a login', async () => {
    const token = ref('old')
    const client = fakeClient('connected')
    followToken(client, () => token.value)

    token.value = 'new'
    await nextTick()

    expect(client.setToken).toHaveBeenCalledWith('new')
    expect(client.disconnect).toHaveBeenCalledOnce()
    expect(client.connect).toHaveBeenCalledOnce()
  })

  it('connects a disconnected client once a token arrives', async () => {
    const token = ref('')
    const client = fakeClient('disconnected')
    followToken(client, () => token.value)

    token.value = 'new'
    await nextTick()

    expect(client.setToken).toHaveBeenCalledWith('new')
    expect(client.disconnect).not.toHaveBeenCalled()
    expect(client.connect).toHaveBeenCalledOnce()
  })

  it('drops the socket on logout instead of keeping the old identity', async () => {
    const token = ref('old')
    const client = fakeClient('connected')
    followToken(client, () => token.value)

    token.value = ''
    await nextTick()

    expect(client.setToken).toHaveBeenCalledWith('')
    expect(client.disconnect).toHaveBeenCalledOnce()
    expect(client.connect).not.toHaveBeenCalled()
  })

  it('does nothing while the token stays the same', async () => {
    const token = ref('same')
    const client = fakeClient('connected')
    followToken(client, () => token.value)

    token.value = 'same'
    await nextTick()

    expect(client.setToken).not.toHaveBeenCalled()
    expect(client.connect).not.toHaveBeenCalled()
  })
})
