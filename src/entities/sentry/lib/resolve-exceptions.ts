import type { Sentry, SentryException, SentryFrame } from '../types'

type Stacktrace = { frames?: SentryFrame[] }

const hasFrames = (st?: Stacktrace): boolean => Boolean(st?.frames && st.frames.length > 0)

// The text of a message event: `message` is a string in the store API and
// {formatted, message, params} in envelopes; older SDKs send `logentry`.
export const sentryMessageText = (payload?: Sentry): string => {
  const message = payload?.message as unknown
  if (typeof message === 'string') return message
  if (message && typeof message === 'object') {
    const obj = message as { formatted?: string; message?: string }
    return obj.formatted || obj.message || ''
  }
  return payload?.logentry?.message || ''
}

const topLevelStacktrace = (payload?: Sentry): Stacktrace | undefined => {
  const top = (payload as { stacktrace?: Stacktrace } | undefined)?.stacktrace
  if (hasFrames(top)) return top

  const threads = (payload as { threads?: { values?: Array<{ stacktrace?: Stacktrace }> } } | undefined)
    ?.threads
  for (const thread of threads?.values ?? []) {
    if (hasFrames(thread.stacktrace)) return thread.stacktrace
  }
  return undefined
}

// resolveExceptionValues returns the event's exception values, or — for a message
// event whose stacktrace is attached at the top level or under threads (PHP
// captureMessage with attach_stacktrace, some JS SDKs) — a single synthesized
// exception so the trace renders like any other.
export const resolveExceptionValues = (payload?: Sentry): SentryException[] => {
  const values = payload?.exception?.values
  if (values && values.length > 0) return values

  const stacktrace = topLevelStacktrace(payload)
  if (stacktrace) {
    return [{ type: 'Message', value: sentryMessageText(payload), stacktrace } as SentryException]
  }
  return []
}
