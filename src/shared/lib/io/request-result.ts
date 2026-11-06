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

// What to tell the person when a load failed: plain words, no stack.
export const describeLoadError = (error: unknown): string => {
  const status = (error as { status?: unknown })?.status

  if (status === 401 || status === 403) {
    return 'Access denied. Sign in again.'
  }

  if (typeof status === 'number') {
    return `The server answered ${status}.`
  }

  if (error instanceof TypeError) {
    return 'The server cannot be reached.'
  }

  return error instanceof Error && error.message ? error.message : 'Unknown error.'
}
