import type { XdebugClosedReason, XdebugFrame, XdebugSession, XdebugVar } from '../types'

const stripScheme = (file: string) => file.replace(/^file:\/\//, '')

export const splitPath = (file: string | undefined) => {
  const path = stripScheme(file ?? '')
  const cut = path.lastIndexOf('/') + 1
  return { dir: path.slice(0, cut), name: path.slice(cut) }
}

export const shortFile = (file: string | undefined) => splitPath(file).name

export const sessionTitle = (s: XdebugSession) => s.target || shortFile(s.entry_file) || `Session #${s.id}`

// A tombstone is a closed session the server keeps for ten minutes.
export const isLive = (s: XdebugSession) => !s.closed_reason && s.state !== 'stopped' && s.state !== 'detached'

export const closedReasonText = (reason: XdebugClosedReason | undefined, ideAddr: string) => {
  switch (reason) {
    case 'ide_unreachable':
      return `IDE not reachable at ${ideAddr}. The script ran on without debugging.`
    case 'ide_closed':
      return 'The IDE closed the connection. The script ran on without debugging.'
    case 'engine_closed':
      return 'The script finished or Xdebug closed the connection.'
    case 'stopped':
      return 'The session was stopped.'
    default:
      return 'The session has ended.'
  }
}

export type FrameRow =
  | { kind: 'frame'; frame: XdebugFrame }
  | { kind: 'group'; count: number; first: number }

// Folds each run of vendor frames into one «N framework frames» row. A run
// stays open when it holds the selected frame or the person expanded it
// (`expanded` holds the level of the run's first frame).
export const foldFrames = (frames: XdebugFrame[], selected: number, expanded: Set<number>): FrameRow[] => {
  const rows: FrameRow[] = []
  let i = 0
  while (i < frames.length) {
    if (!frames[i].vendor) {
      rows.push({ kind: 'frame', frame: frames[i] })
      i += 1
      continue
    }
    let end = i
    while (end < frames.length && frames[end].vendor) end += 1
    const run = frames.slice(i, end)
    const first = run[0].level
    if (expanded.has(first) || run.some((f) => f.level === selected)) {
      run.forEach((frame) => rows.push({ kind: 'frame', frame }))
    } else {
      rows.push({ kind: 'group', count: run.length, first })
    }
    i = end
  }
  return rows
}

export const hasChildren = (v: XdebugVar) => (v.type === 'object' || v.type === 'array') && (v.numchildren ?? 0) > 0

export const varSummary = (v: XdebugVar): { text: string; count: string } => {
  if (v.type === 'object') return { text: (v.class ?? 'object').split('\\').pop() ?? 'object', count: `{${v.numchildren ?? 0}}` }
  if (v.type === 'array') return { text: 'array', count: `(${v.numchildren ?? 0})` }
  if (v.type === 'string') return { text: `"${v.value ?? ''}"`, count: '' }
  if (v.type === 'bool') return { text: v.value === '1' ? 'true' : 'false', count: '' }
  if (v.type === 'null' || v.value === undefined) return { text: v.type === 'null' ? 'null' : v.type, count: '' }
  return { text: v.value, count: '' }
}

// fullname → printed value of every loaded node, to diff two pauses.
export const flattenValues = (vars: XdebugVar[], into = new Map<string, string>()) => {
  vars.forEach((v) => {
    const { text, count } = varSummary(v)
    into.set(v.fullname, `${v.type}:${text}${count}`)
    if (v.children) flattenValues(v.children, into)
  })
  return into
}

export const changedNames = (before: Map<string, string> | null, after: Map<string, string>) => {
  const changed = new Set<string>()
  if (!before) return changed
  after.forEach((value, name) => {
    if (before.get(name) !== value) changed.add(name)
  })
  return changed
}

export type PhpToken = { kind: '' | 'k' | 's' | 'v' | 'n' | 'c'; text: string }

const PHP_TOKEN =
  /(\/\/.*$|#.*$|\/\*.*?(?:\*\/|$))|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\$[A-Za-z_]\w*)|\b(abstract|array|as|bool|break|case|catch|class|clone|const|continue|declare|default|do|echo|else|elseif|enum|extends|false|final|finally|float|fn|for|foreach|function|global|if|implements|include|include_once|instanceof|int|interface|match|mixed|namespace|new|null|parent|private|protected|public|readonly|require|require_once|return|self|static|string|switch|throw|trait|true|try|use|void|while|yield)\b|\b(\d+(?:\.\d+)?)\b/g

// Line-by-line PHP highlight for the code view. Rendered as text spans, so
// source from the debugged app never reaches the page as HTML.
export const highlightPhp = (line: string): PhpToken[] => {
  const out: PhpToken[] = []
  let last = 0
  for (const m of line.matchAll(PHP_TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push({ kind: '', text: line.slice(last, at) })
    const kind = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'v' : m[4] ? 'k' : 'n'
    out.push({ kind, text: m[0] })
    last = at + m[0].length
  }
  if (last < line.length) out.push({ kind: '', text: line.slice(last) })
  return out
}
