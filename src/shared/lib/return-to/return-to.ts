// The page to open after sign-in (?return_to=). Only a path of this site
// passes: one leading slash, no scheme or host, not the login page itself.
// The server checks the same on its side (internal/auth safeReturnTo).
export const safeReturnTo = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.startsWith('/')) return undefined
  if (value === '/' || value.startsWith('//') || value.startsWith('/\\')) return undefined
  if (/^\/login(?:[/?#]|$)/.test(value)) return undefined

  return value
}

// The sign-in address that brings the person back to `returnTo`.
export const withReturnTo = (loginUrl: string, returnTo: unknown): string => {
  const page = safeReturnTo(returnTo)
  if (!page) return loginUrl

  const joiner = loginUrl.includes('?') ? '&' : '?'
  return `${loginUrl}${joiner}return_to=${encodeURIComponent(page)}`
}
