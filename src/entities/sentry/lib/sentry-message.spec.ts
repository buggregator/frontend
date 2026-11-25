import { describe, expect, it } from 'vitest'
import type { ServerEvent } from '@/shared/types'
import type { Sentry } from '../types'
import { normalizeSentryEvent } from './normalize-sentry-event'
import { resolveExceptionValues, sentryList, sentryMessageText } from './resolve-exceptions'

const serverEvent = (payload: Record<string, unknown>) =>
  ({ uuid: 'u1', type: 'sentry', timestamp: 0, project: null, payload }) as unknown as ServerEvent<Sentry>

// Audit 5.12: a captureMessage event showed raw JSON, was labelled «exception».
describe('Sentry message events', () => {
  it('reads the message text from a string, {formatted}, {message} or logentry', () => {
    expect(sentryMessageText({ message: 'plain' } as unknown as Sentry)).toBe('plain')
    expect(sentryMessageText({ message: { formatted: 'Order 7 paid', message: 'Order %s paid' } } as unknown as Sentry)).toBe('Order 7 paid')
    expect(sentryMessageText({ message: { message: 'Order %s paid' } } as unknown as Sentry)).toBe('Order %s paid')
    expect(sentryMessageText({ logentry: { message: 'from logentry' } } as unknown as Sentry)).toBe('from logentry')
    expect(sentryMessageText({} as Sentry)).toBe('')
  })

  it('labels a message event «message» and an exception event «exception»', () => {
    expect(normalizeSentryEvent(serverEvent({ message: { formatted: 'hi' } })).labels).toContain('message')
    expect(normalizeSentryEvent(serverEvent({ message: { formatted: 'hi' } })).labels).not.toContain('exception')
    expect(normalizeSentryEvent(serverEvent({ exception: { values: [{ type: 'E', value: 'x' }] } })).labels).toContain('exception')
    const withTrace = { message: 'hi', stacktrace: { frames: [{ filename: 'a.php', lineno: 1 }] } }
    expect(normalizeSentryEvent(serverEvent(withTrace)).labels).toContain('message')
  })

  it('leaves out an environment that is null or empty', () => {
    expect(normalizeSentryEvent(serverEvent({ environment: null })).origin).not.toHaveProperty('environment')
    expect(normalizeSentryEvent(serverEvent({ environment: 'local' })).origin).toMatchObject({ environment: 'local' })
  })
})

// sentry-go sends exception, threads and breadcrumbs as bare lists (#7098).
describe('sentryList', () => {
  it.each([
    ['{values: [...]}', { values: [1, 2] }, [1, 2]],
    ['a bare list', [1, 2], [1, 2]],
    ['nothing', undefined, []],
    ['values that are not a list', { values: 'x' }, []],
  ])('%s', (_, field, expected) => {
    expect(sentryList(field)).toEqual(expected)
  })

  it('a message event with threads as a bare list gets its stacktrace', () => {
    const frames = [{ function: 'main', abs_path: '/app/main.go', lineno: 39 }]
    const values = resolveExceptionValues({ message: 'slow', threads: [{ stacktrace: { frames } }] } as never)
    expect(values).toHaveLength(1)
    expect(values[0].stacktrace?.frames).toEqual(frames)
  })
})
