// Did a write reach the server and succeed?
//
// REST answers are a Response. The WebSocket RPC bridge resolves with
// { data: { code, data } }, where `code` is the HTTP status of the handler;
// it resolves for errors too, so only a 2xx code counts. Anything else
// (undefined after a caught network error, an answer without a code) fails.
export const isRequestOk = (result: unknown): boolean => {
  if (!result) {
    return false
  }

  if (typeof Response !== 'undefined' && result instanceof Response) {
    return result.ok
  }

  const code = (result as { data?: { code?: unknown } }).data?.code

  return typeof code === 'number' && code >= 200 && code < 300
}
