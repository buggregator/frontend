import type { PageContext } from '@/shared/lib/assist'

// The panel's words that depend on the context (#7113 A, #7111).

export const SETUP_GUIDE_URL = 'https://docs.buggregator.dev/config/agents.html'

export const STATUS_TEXT = {
  connecting: 'harnsy is not reachable yet: the button works once Buggregator connects.',
  stopped: 'Buggregator stopped connecting to harnsy. Check explain.url and explain.token, then restart.'
} as const

const isError = (ctx: PageContext) => ctx.kind === 'event' && /^Sentry error\b/.test(ctx.title)

export const emptyTitle = (ctx: PageContext | null): string => {
  if (!ctx || ctx.kind === 'page') return 'Ask about this page'
  return isError(ctx) ? 'Ask about this error' : 'Ask about this event'
}

export const emptyAbilities = (ctx: PageContext | null): string[] => {
  if (!ctx || ctx.kind === 'page') {
    return ['Sum up what the page shows', 'Spot events that look wrong', 'Tell you what to open first']
  }
  return isError(ctx)
    ? ['Explain why the error happened', 'Find similar events and when it started', 'Suggest a fix and a test that reproduces it']
    : ['Explain what the event shows', 'Find similar events', 'Point out anything unusual in it']
}

export const suggestionsFor = (ctx: PageContext | null): string[] => {
  if (ctx?.suggestions?.length) return ctx.suggestions.slice(0, 3)
  if (!ctx || ctx.kind === 'page') {
    return ['What is on this page?', 'Does anything here look wrong?', 'What should I look at first?']
  }
  return isError(ctx)
    ? ['Why does this fail?', 'When did this start, and how often?', 'Write a test that reproduces it']
    : ['What does this event tell me?', 'Does anything here look wrong?', 'Find similar events']
}

export const placeholderFor = (ctx: PageContext | null): string => {
  if (!ctx || ctx.kind === 'page') return 'Ask about this page…'
  return isError(ctx) ? 'Ask about this error…' : 'Ask about this event…'
}

// «Sentry error · OrderError: Order 15 not found» → kind and subject.
export const splitTitle = (title: string): { kind: string; subject: string } => {
  const i = title.indexOf(' · ')
  return i < 0 ? { kind: '', subject: title } : { kind: title.slice(0, i), subject: title.slice(i + 3) }
}

export const timeOf = (at?: string): string => {
  if (!at) return ''
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// «5 min», «2 h», «yesterday», «3 days» for Recent.
export const agoOf = (at: string | undefined, now = Date.now()): string => {
  if (!at) return ''
  const t = new Date(at).getTime()
  if (Number.isNaN(t)) return ''
  const min = Math.max(0, Math.round((now - t) / 60000))
  if (min < 1) return 'now'
  if (min < 60) return `${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days`
}

// «server-lid» → «SL»; the avatar of an agent's answer.
export const initialsOf = (name = ''): string => {
  const parts = name.split(/[^A-Za-z0-9]+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? 'A').slice(0, 2)).toUpperCase()
}
