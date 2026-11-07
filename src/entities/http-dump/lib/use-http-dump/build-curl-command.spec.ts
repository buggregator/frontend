import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import type { HttpDump } from '../../types'
import { useHttpDumpEvent } from './use-http-dump-event'

// Payloads as the Go server stores them (modules/httpdumps/handler.go):
// host in payload.host, path without its leading «/», query separate.
const dump = (request: Partial<HttpDump['request']>, extra: Partial<HttpDump> = {}) =>
  ({
    received_at: '2026-11-07 12:00:00',
    host: '127.0.0.1:8000',
    request: { method: 'POST', uri: 'webhooks/orders', headers: {}, body: '', query: {}, post: {}, cookies: {}, files: [], ...request },
    ...extra,
  }) as HttpDump

const curl = (payload: HttpDump) =>
  useHttpDumpEvent(ref({ payload } as unknown as NormalizedEvent<HttpDump>)).curlCommand.value

describe('HTTP dump cURL command', () => {
  it('builds the URL from payload.host, the path with «/» and the query', () => {
    const cmd = curl(dump({ query: { source: 'shop', tag: ['a', 'b'] } }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X POST 'http://127.0.0.1:8000/webhooks/orders?source=shop&tag=a&tag=b'")
  })

  it('sends every value of a header and skips Host and Content-Length', () => {
    const cmd = curl(dump({ headers: { Host: ['x'], 'Content-Length': ['3'], Accept: ['text/html', 'application/json'] } }))
    expect(cmd).toContain("-H 'Accept: text/html'")
    expect(cmd).toContain("-H 'Accept: application/json'")
    expect(cmd).not.toMatch(/Host:|Content-Length:/)
  })

  it('sends the raw body with -d and escapes single quotes', () => {
    const cmd = curl(dump({ headers: { 'Content-Type': ['application/json'] }, body: `{"name":"O'Brien"}` }))
    expect(cmd).toContain(`-d '{"name":"O'\\''Brien"}'`)
  })

  it('turns a multipart request into -F parts without its Content-Type', () => {
    const cmd = curl(
      dump({
        headers: { 'Content-Type': ['multipart/form-data; boundary=----7d1'] },
        post: { event: 'order.paid', ids: ['1', '2'] },
        files: [{ uuid: 'u1', name: 'invoice.pdf', size: 10, mime: 'application/pdf', path: '' }],
      }),
    )
    expect(cmd).toContain("-F 'event=order.paid'")
    expect(cmd).toContain("-F 'ids=1'")
    expect(cmd).toContain("-F 'ids=2'")
    expect(cmd).toContain("-F 'file=@invoice.pdf'")
    expect(cmd).not.toContain('Content-Type')
    expect(cmd).not.toContain(' -d ')
  })

  it('keeps a path that already starts with «/» (proxy) and adds the query', () => {
    const cmd = curl(dump({ method: 'GET', uri: '/v1/charges', query: { limit: '10' } }, { proxy: true, host: 'api.example.com' }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X GET 'api.example.com/v1/charges?limit=10'")
  })
})
