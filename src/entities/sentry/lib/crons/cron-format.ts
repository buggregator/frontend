import type { CronSchedule } from '../../types'

// Words for schedules, durations and times of cron monitors (#6617). Times
// are shown in the monitor's own time zone: its schedule is written in it.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays']
const DAY_NAMES: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

const MACROS: Record<string, string> = {
  '@yearly': 'Once a year',
  '@annually': 'Once a year',
  '@monthly': 'Monthly',
  '@weekly': 'Weekly',
  '@daily': 'Daily at 00:00',
  '@midnight': 'Daily at 00:00',
  '@hourly': 'Every hour'
}

const isNum = (v: string) => /^\d+$/.test(v)
const pad = (n: number | string) => String(n).padStart(2, '0')
const plural = (n: number, word: string) => (n === 1 ? `1 ${word}` : `${n} ${word}s`)

const dayOfWeek = (v: string): number | null => {
  if (isNum(v)) {
    const n = Number(v)
    return n >= 0 && n <= 7 ? n % 7 : null
  }
  return DAY_NAMES[v.toLowerCase()] ?? null
}

/** Plain words for the common crontab shapes; null for anything else. */
export const describeCrontab = (expr: string): string | null => {
  const value = expr.trim()
  if (MACROS[value]) return MACROS[value]
  const every = /^@every\s+(.+)$/.exec(value)
  if (every) return `Every ${every[1]}`

  const parts = value.split(/\s+/)
  if (parts.length !== 5) return null
  const [min, hour, dom, mon, dow] = parts
  if (mon !== '*') return null

  const step = (v: string) => /^\*\/(\d+)$/.exec(v)?.[1]

  if (hour === '*' && dom === '*' && dow === '*') {
    if (min === '*') return 'Every minute'
    const s = step(min)
    if (s) return `Every ${plural(Number(s), 'minute')}`
    if (isNum(min)) return `Hourly at :${pad(min)}`
    return null
  }
  if (!isNum(min)) return null

  const hs = step(hour)
  if (hs && dom === '*' && dow === '*') return `Every ${plural(Number(hs), 'hour')} at :${pad(min)}`
  if (!isNum(hour)) return null

  const at = `${pad(hour)}:${pad(min)}`
  if (dom === '*' && dow === '*') return `Daily at ${at}`
  if (dom === '*') {
    if (dow === '1-5' || dow.toLowerCase() === 'mon-fri') return `Weekdays at ${at}`
    const d = dayOfWeek(dow)
    return d === null ? null : `${DAYS[d]} at ${at}`
  }
  if (dow === '*' && isNum(dom)) return `Monthly on day ${Number(dom)} at ${at}`
  return null
}

/** The schedule in words and as written: «Every 5 minutes» and `*\/5 * * * *`. */
export const describeSchedule = (schedule: CronSchedule | null | undefined): { words: string; expr: string } => {
  if (!schedule || !schedule.type) return { words: 'No schedule', expr: '' }
  if (schedule.type === 'interval') {
    const n = Number(schedule.value)
    const unit = schedule.unit || 'minute'
    return {
      words: Number.isFinite(n) && n > 0 ? `Every ${n === 1 ? unit : `${n} ${unit}s`}` : 'Interval',
      expr: `interval ${schedule.value} ${unit}`
    }
  }
  return { words: describeCrontab(schedule.value) ?? 'Custom schedule', expr: schedule.value }
}

/** «340 ms», «8.4 s», «4 min 12 s», «2 h 5 min»; «—» without a duration. */
export const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`
  const total = Math.round(s)
  const m = Math.floor(total / 60)
  const sec = total % 60
  if (m < 60) return sec ? `${m} min ${sec} s` : `${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h} h ${mm} min` : `${h} h`
}

/** «2 min ago», «in 3 min», «just now». */
export const formatRelative = (iso: string | null | undefined, now: number): string => {
  if (!iso) return ''
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const diff = at - now
  const abs = Math.abs(diff)
  if (abs < 45_000) return diff <= 0 ? 'just now' : 'in a moment'
  let text: string
  if (abs < HOUR) text = `${Math.max(1, Math.round(abs / MINUTE))} min`
  else if (abs < 2 * DAY) text = `${Math.round(abs / HOUR)} h`
  else text = `${Math.round(abs / DAY)} d`
  return diff < 0 ? `${text} ago` : `in ${text}`
}

const formatters = new Map<string, Intl.DateTimeFormat>()
const formatter = (timeZone: string, withSeconds: boolean) => {
  const key = `${timeZone}|${withSeconds}`
  let f = formatters.get(key)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: withSeconds ? '2-digit' : undefined,
        hourCycle: 'h23'
      })
    } catch {
      // A time zone this browser does not know: UTC, and say so.
      return formatter('UTC', withSeconds)
    }
    formatters.set(key, f)
  }
  return f
}

export const knownTimeZone = (timeZone: string | null | undefined): string => {
  if (!timeZone) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * A time in the monitor's zone: «14:10» today, «20 Nov 02:30» another day.
 * `seconds` adds them (check-in rows).
 */
export const formatClock = (
  iso: string | null | undefined,
  timeZone: string,
  now: number,
  seconds = false
): string => {
  if (!iso) return ''
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const f = formatter(knownTimeZone(timeZone), seconds)
  const parts = (t: number) => Object.fromEntries(f.formatToParts(t).map((p) => [p.type, p.value]))
  const p = parts(at)
  const today = parts(now)
  const time = seconds ? `${p.hour}:${p.minute}:${p.second}` : `${p.hour}:${p.minute}`
  return p.day === today.day && p.month === today.month ? time : `${p.day} ${p.month} ${time}`
}
