import type { XdebugBreakpoint, XdebugBreakpointDraft, XdebugBreakpointState, XdebugSavedBreakpoint } from '../types'

export const LINE_HINT = '/app/src/Services/CartService.php:43'
const NEED_LINE = `Add a line number after the colon, e.g. ${LINE_HINT}`
const NEED_ANY = `Type path:line, e.g. ${LINE_HINT}, or an exception class such as \\RuntimeException`

const CLASS_NAME = /^\\?[A-Za-z_][A-Za-z0-9_]*(\\[A-Za-z_][A-Za-z0-9_]*)*$/
const PATH_LIKE = /[/\\.]/

// The add field: `path:line` or an exception class. A path without a valid
// line asks for one; the server checks the path itself.
export const parseBreakpointInput = (raw: string): { draft?: XdebugBreakpointDraft; error?: string } => {
  const text = raw.trim()
  if (!text) return {}
  const m = /^(.+):(\d+)$/.exec(text)
  if (m && Number(m[2]) >= 1) return { draft: { type: 'line', file: m[1], line: Number(m[2]) } }
  if (CLASS_NAME.test(text) && !text.includes('.')) return { draft: { type: 'exception', exception: text } }
  if (PATH_LIKE.test(text)) return { error: NEED_LINE }
  return { error: NEED_ANY }
}

// The path PHP sees, without the file:// scheme (file:///C:/x → C:/x).
export const filePath = (uri: string | undefined) => {
  const path = (uri ?? '').replace(/^file:\/\//, '')
  return /^\/[A-Za-z]:\//.test(path) ? path.slice(1) : path
}

export type BreakpointRow = {
  bp: XdebugSavedBreakpoint
  // In the selected session, when Buggregator drives it.
  state?: XdebugBreakpointState
  hits: number
  // Xdebug stops on this line instead (no code on the saved one).
  movedTo?: number
}

const byId = (session: XdebugBreakpoint[]) => new Map(session.map((b) => [String(b.id), b]))

// Panel rows: the saved list, with the state in the selected session when
// Buggregator drives it (an IDE's own breakpoints are another list).
export const breakpointRows = (saved: XdebugSavedBreakpoint[], session: XdebugBreakpoint[], drivenHere: boolean): BreakpointRow[] => {
  const states = drivenHere ? byId(session) : new Map<string, XdebugBreakpoint>()
  return saved.map((bp) => {
    const s = states.get(String(bp.id))
    const moved = s?.resolved_line && s.resolved_line !== bp.line ? s.resolved_line : undefined
    return { bp, state: s?.state as XdebugBreakpointState | undefined, hits: s?.hit_count ?? 0, movedTo: moved }
  })
}

// on: set · cond: set with a condition · off: disabled · unres: not set where
// saved (not resolved, moved, skipped or waiting for the next pause).
export type GutterMark = 'on' | 'cond' | 'off' | 'unres'

const NOT_SET = new Set(['unresolved', 'skipped', 'pending'])

export const gutterMarks = (file: string | undefined, saved: XdebugSavedBreakpoint[], session: XdebugBreakpoint[], drivenHere: boolean) => {
  const marks = new Map<number, GutterMark>()
  if (!file) return marks
  for (const row of breakpointRows(saved, session, drivenHere)) {
    const { bp } = row
    if (bp.type !== 'line' || bp.file !== file || !bp.line) continue
    let mark: GutterMark = bp.condition ? 'cond' : 'on'
    if (!bp.enabled) mark = 'off'
    else if (row.movedTo || (row.state && NOT_SET.has(row.state))) mark = 'unres'
    marks.set(bp.line, mark)
  }
  return marks
}
