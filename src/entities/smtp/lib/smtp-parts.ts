import type { SMTP, SMTPCalendar, SMTPCalendarPerson } from '../types'

// Other versions of an email body (#6829): Apple Watch, AMP, calendar and
// the rest the server keeps in `payload.parts`, and the invite in
// `payload.calendar`. Pure helpers for the page, the invite card and the list.

const HTML_PARTS = ['text/watch-html', 'text/x-amp-html', 'text/html']

export const isHtmlPart = (type: string) => HTML_PARTS.includes(type.toLowerCase())

export const isCalendarPart = (type: string) => type.toLowerCase() === 'text/calendar'

export const partTabId = (index: number) => `part-${index}`

export const partTabs = (parts: SMTP['parts']) =>
  (parts ?? []).map((part, index) => ({ id: partTabId(index), label: part.label || part.type }))

export type InviteState = 'invite' | 'cancelled' | 'reply' | 'event'

export const inviteState = (calendar: SMTPCalendar): InviteState => {
  const method = calendar.method?.toUpperCase()
  if (method === 'CANCEL' || calendar.status?.toUpperCase() === 'CANCELLED') return 'cancelled'
  if (method === 'REQUEST') return 'invite'
  if (method === 'REPLY') return 'reply'
  return 'event'
}

export const inviteStateLabel: Record<InviteState, string> = {
  invite: 'Invitation',
  cancelled: 'Cancelled',
  reply: 'Reply',
  event: 'Calendar event',
}

const BADGES: Record<string, string> = {
  'text/watch-html': 'Watch',
  'text/x-amp-html': 'AMP',
}

// The marks of a message in the list: «Watch», «AMP», «Invite» / «Cancelled».
export const listBadges = (payload: Pick<SMTP, 'parts' | 'calendar'>): string[] => {
  const badges = (payload.parts ?? [])
    .map((part) => BADGES[part.type.toLowerCase()])
    .filter((badge): badge is string => !!badge)
  if (payload.calendar) {
    badges.push(inviteState(payload.calendar) === 'cancelled' ? 'Cancelled' : 'Invite')
  }
  return [...new Set(badges)]
}

type FormatOptions = { timeZone?: string; locale?: string }

const OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/

const partsOf = (date: Date, timeZone: string, locale: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    day: `${get('weekday')}, ${get('day')} ${get('month')} ${get('year')}`,
    time: `${get('hour')}:${get('minute')}`,
    zone: get('timeZoneName'),
  }
}

const parseLocal = (value: string) => {
  const m = LOCAL.exec(value)
  if (!m) return null
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
}

const range = (
  start: ReturnType<typeof partsOf>,
  end: ReturnType<typeof partsOf> | null,
  zone: string
) => {
  if (!end) return `${start.day}, ${start.time} (${zone})`
  if (end.day === start.day) return `${start.day}, ${start.time} – ${end.time} (${zone})`
  return `${start.day}, ${start.time} – ${end.day}, ${end.time} (${zone})`
}

// When the event is. A known zone → the viewer's clock; an unknown zone
// (Outlook names) → the sender's clock with that name; all day → dates only,
// the end date of iCalendar being exclusive.
export const formatInviteWhen = (calendar: SMTPCalendar, options: FormatOptions = {}): string => {
  const { start, end } = calendar
  if (!start) return ''
  const locale = options.locale ?? 'en-GB'

  if (calendar.all_day) {
    const from = parseLocal(start)
    if (!from) return start
    const first = partsOf(from, 'UTC', locale).day
    const until = end ? parseLocal(end) : null
    if (until) until.setUTCDate(until.getUTCDate() - 1)
    const last = until && until > from ? partsOf(until, 'UTC', locale).day : first
    return last === first ? `${first}, all day` : `${first} – ${last}, all day`
  }

  if (OFFSET.test(start)) {
    const from = new Date(start)
    if (Number.isNaN(from.getTime())) return start
    const timeZone = options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    const a = partsOf(from, timeZone, locale)
    const until = end ? new Date(end) : null
    const b = until && !Number.isNaN(until.getTime()) ? partsOf(until, timeZone, locale) : null
    return range(a, b, a.zone)
  }

  const from = parseLocal(start)
  if (!from) return start
  const until = end ? parseLocal(end) : null
  const a = partsOf(from, 'UTC', locale)
  const b = until ? partsOf(until, 'UTC', locale) : null
  return range(a, b, calendar.tz || 'local time')
}

const FREQ: Record<string, string> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

export const repeatLabel = (rrule?: string): string => {
  if (!rrule) return ''
  const rules = Object.fromEntries(rrule.split(';').map((r) => r.split('=') as [string, string]))
  const freq = FREQ[rules.FREQ?.toUpperCase()]
  if (!freq) return `Repeats: ${rrule}`
  return Object.keys(rules).length === 1 ? `Repeats ${freq}` : `Repeats ${freq} (${rrule})`
}

const STATUS: Record<string, string> = {
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  TENTATIVE: 'Maybe',
  'NEEDS-ACTION': 'No answer',
  DELEGATED: 'Delegated',
}

export const attendeeStatusLabel = (status?: string) =>
  status ? (STATUS[status.toUpperCase()] ?? status) : ''

export const personLabel = (person: SMTPCalendarPerson) =>
  person.name && person.email ? `${person.name} <${person.email}>` : (person.name || person.email || '')
