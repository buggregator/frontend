import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import type { HttpDump } from '../../types'
import { buildCurlCommand } from './build-curl-command'
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

const UI = 'http://127.0.0.1:8000'

// The builder with the origin of the UI being viewed, as the composable passes it.
const curl = (payload: HttpDump) => buildCurlCommand(payload, UI)

describe('HTTP dump cURL command', () => {
  it('builds the URL from the UI origin, the path with «/» and the query', () => {
    const cmd = curl(dump({ query: { source: 'shop', tag: ['a', 'b'] } }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X POST 'http://127.0.0.1:8000/webhooks/orders?source=shop&tag=a&tag=b'")
  })

  it('sends every value of a header and skips Host and Content-Length', () => {
    const cmd = curl(dump({ headers: { Host: ['x'], 'Content-Length': ['3'], Accept: ['text/html', 'application/json'] } }))
    expect(cmd).toContain("-H 'Accept: text/html'")
    expect(cmd).toContain("-H 'Accept: application/json'")
    expect(cmd).not.toMatch(/Host:|Content-Length:/)
  })

  it('sends the raw body with --data-raw and escapes single quotes', () => {
    const cmd = curl(dump({ headers: { 'Content-Type': ['application/json'] }, body: `{"name":"O'Brien"}` }))
    expect(cmd).toContain(`--data-raw '{"name":"O'\\''Brien"}'`)
  })

  it('turns a multipart request into --form-string parts without its Content-Type', () => {
    const cmd = curl(
      dump({
        headers: { 'Content-Type': ['multipart/form-data; boundary=----7d1'] },
        post: { event: 'order.paid', ids: ['1', '2'] },
        files: [{ uuid: 'u1', name: 'invoice.pdf', size: 10, mime: 'application/pdf', path: '' }],
      }),
    )
    expect(cmd).toContain("--form-string 'event=order.paid'")
    expect(cmd).toContain("--form-string 'ids=1'")
    expect(cmd).toContain("--form-string 'ids=2'")
    expect(cmd).not.toContain('Content-Type')
    expect(cmd).not.toContain('--data-raw')
    // Files are a hint after the command, never an active -F that reads a local file.
    expect(cmd.split('\n#')[0]).not.toContain('-F ')
    expect(cmd.split('\n').at(-1)).toBe("# file: invoice.pdf (not sent; add -F 'file=@<path>' to attach it)")
  })

  it('keeps a path that already starts with «/» (proxy), adds the query and http when no scheme is stored', () => {
    const cmd = curl(dump({ method: 'GET', uri: '/v1/charges', query: { limit: '10' } }, { proxy: true, host: 'api.example.com' }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X GET 'http://api.example.com/v1/charges?limit=10'")
  })

  it('keeps the scheme of a proxied request (server sends payload.scheme)', () => {
    const cmd = curl(dump({ method: 'GET', uri: 'v1/charges' }, { proxy: true, host: 'api.example.com', scheme: 'https' }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X GET 'https://api.example.com/v1/charges'")
  })

  it('quotes a method that is not plain letters, so pasting it runs nothing', () => {
    expect(curl(dump({ method: '`touch$IFS.pwned`' }))).toMatch(/^curl -X '`touch\$IFS\.pwned`' /)
    expect(curl(dump({ method: "PO'ST" }))).toMatch(/^curl -X 'PO'\\''ST' /)
    expect(curl(dump({ method: 'PATCH' }))).toMatch(/^curl -X PATCH /)
  })

  it('never lets a body or a field starting with @ or < read a local file', () => {
    expect(curl(dump({ body: '@.env' }))).toContain("--data-raw '@.env'")
    expect(curl(dump({ body: '@.env' }))).not.toMatch(/ -d /)
    const cmd = curl(
      dump({ headers: { 'Content-Type': ['multipart/form-data; boundary=x'] }, post: { a: '@.env', b: '<.env' } }),
    )
    expect(cmd).toContain("--form-string 'a=@.env'")
    expect(cmd).toContain("--form-string 'b=<.env'")
    expect(cmd).not.toMatch(/-F '/)
  })

  it('percent-encodes each path segment of the decoded path', () => {
    const cmd = curl(dump({ method: 'GET', uri: 'files/a b/100%/x?y' }))
    expect(cmd.split(' \\\n')[0]).toBe("curl -X GET 'http://127.0.0.1:8000/files/a%20b/100%25/x%3Fy'")
  })

  it('sends a dump to the UI the browser shows, not to the Host the sender gave', () => {
    const cmd = useHttpDumpEvent(ref({ payload: dump({}, { host: 'buggregator:8000' }) } as unknown as NormalizedEvent<HttpDump>))
      .curlCommand.value
    expect(cmd.split(' \\\n')[0]).toBe(`curl -X POST '${window.location.origin}/webhooks/orders'`)
  })
})
