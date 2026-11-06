import { afterEach, describe, expect, it, vi } from 'vitest'
import { guardHandler } from './guard-handler'

describe('guardHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes the arguments through', () => {
    const handler = vi.fn()
    guardHandler('publication', handler)({ data: 1 }, 'x')
    expect(handler).toHaveBeenCalledWith({ data: 1 }, 'x')
  })

  // centrifuge-js 5.8 stops the client, without reconnecting, when an app
  // event handler throws.
  it('keeps an exception inside the handler and reports it', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const boom = new Error('bad payload')
    const run = guardHandler('publication', () => {
      throw boom
    })

    expect(() => run()).not.toThrow()
    expect(error).toHaveBeenCalledWith('WebSocket "publication" handler failed:', boom)
  })
})
