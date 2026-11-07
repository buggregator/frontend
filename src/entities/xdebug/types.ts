// Shapes of the Xdebug proxy API (server PR #368, `/api/xdebug…`; driving
// sessions without an IDE: server PR #392).

// How a new session is driven: relayed to the IDE, by Buggregator, or the IDE
// when one listens and Buggregator otherwise.
export type XdebugMode = 'proxy' | 'auto' | 'standalone'

export type XdebugSettings = {
  mode: XdebugMode
  pause_on_first_line: boolean
  // 0: the idle guard is off.
  idle_timeout_seconds: number
}

// `mode` and the rest are absent on servers before PR #392.
export type XdebugConfig = {
  enabled: boolean
  addr: string
  ide_addr: string
  allow_eval: boolean
  // Agents may step and continue over MCP (server PR #395).
  allow_control?: boolean
} & Partial<XdebugSettings>

export type XdebugDriver = 'ide' | 'here'

// Who sent the last continuation to a session driven here.
export type XdebugContinuationBy = 'ui' | 'agent'

// Continuations the page sends to a session driven here.
export type XdebugCommand = 'run' | 'step-into' | 'step-over' | 'step-out' | 'stop' | 'detach'

export type XdebugSessionState = 'starting' | 'break' | 'running' | 'stopping' | 'stopped' | 'detached'

export type XdebugClosedReason = 'ide_unreachable' | 'ide_closed' | 'engine_closed' | 'stopped' | 'detached' | 'idle_detached'

export type XdebugSession = {
  id: string
  idekey?: string
  state: XdebugSessionState
  kind?: 'http' | 'cli'
  target?: string
  entry_file?: string
  language?: string
  engine?: string
  ide_connected: boolean
  last_file?: string
  last_line?: number
  started_at?: string
  paused_at?: string
  agent_calls: number
  closed_reason?: XdebugClosedReason
  closed_at?: string
} & XdebugDriving

// Who drives a session and when the idle guard releases it (server PR #392).
export type XdebugDriving = {
  driver?: XdebugDriver
  last_continuation_by?: XdebugContinuationBy | null
  last_continuation_agent?: string
  // RFC 3339; null while running or while an IDE drives.
  idle_deadline?: string | null
}

export type XdebugFrame = {
  level: number
  where: string
  file: string
  line: number
  type?: string
  vendor: boolean
}

export type XdebugContext = {
  id: number
  name: string
}

export type XdebugVar = {
  name: string
  fullname: string
  type: string
  class?: string
  facet?: string
  value?: string
  size?: number
  numchildren?: number
  page?: number
  pagesize?: number
  children?: XdebugVar[]
  // Client-only: the whole value (up to the server's cap) has been loaded.
  full?: boolean
}

export type XdebugSourceLine = { line: number; text: string }

export type XdebugSource = {
  file: string
  begin: number
  lines: XdebugSourceLine[]
}

// A breakpoint in one session: what the IDE set (id from Xdebug), or for a
// session driven here a saved one with its state there (numeric id).
export type XdebugBreakpoint = {
  id: string | number
  type: string
  state: string
  file?: string
  line?: number
  function?: string
  hit_count?: number
  // Sessions driven here: the line Xdebug stops at when it moved the breakpoint.
  resolved_line?: number
}

// Saved breakpoints (server PR #401): sent to every session driven here.
export type XdebugBreakpointType = 'line' | 'exception'

export type XdebugSavedBreakpoint = {
  id: number
  type: XdebugBreakpointType
  // file:// URI as PHP sees it (line breakpoints).
  file?: string
  line?: number
  // Class name, e.g. RuntimeException (exception breakpoints; Xdebug matches the class and its parents, not interfaces).
  exception?: string
  // PHP expression; sent only while eval is allowed.
  condition?: string
  enabled: boolean
  // `mcp`: set by an agent.
  source: 'ui' | 'mcp'
  created_at: string
}

// POST body: a plain absolute path becomes a file:// URI on the server.
export type XdebugBreakpointDraft =
  | { type: 'line'; file: string; line: number; condition?: string }
  | { type: 'exception'; exception: string }

// PATCH body: a field left out keeps its value.
export type XdebugBreakpointPatch = Partial<Pick<XdebugSavedBreakpoint, 'enabled' | 'condition'>>

// A saved breakpoint's state in a session driven here.
export type XdebugBreakpointState = 'resolved' | 'unresolved' | 'skipped' | 'disabled' | 'pending'

export type XdebugBreakpointResolved = {
  session_id: string
  breakpoint_id: number
  line: number
}

export type XdebugAgentCall = {
  seq: number
  session_id: string
  at: string
  tool: string
  args: string
  ok: boolean
  result_summary: string
  duration_ms: number
}

export type XdebugAgentCallStarted = {
  session_id: string
  tool: string
  args: string
  at: string
}

export type XdebugStatusUpdate = {
  id: string
  state: XdebugSessionState
  file?: string
  line?: number
  kind?: 'http' | 'cli'
  target?: string
  // +1 per new pause (server PR #371); absent on older servers.
  pause_seq?: number
} & XdebugDriving

// The idle deadline moved after a read or a command (at most every 5 s).
export type XdebugIdleUpdate = {
  id: string
  idle_deadline: string
}

export type XdebugClosedUpdate = {
  id: string
  reason: XdebugClosedReason
  state: XdebugSessionState
}

// Publications on the `xdebug` WebSocket channel: `{event, data}`.
export type XdebugWsMessage =
  | { event: 'session.created'; data: XdebugSession }
  | { event: 'session.status'; data: XdebugStatusUpdate }
  | { event: 'session.closed'; data: XdebugClosedUpdate }
  | { event: 'session.idle'; data: XdebugIdleUpdate }
  | { event: 'agent.call.started'; data: XdebugAgentCallStarted }
  | { event: 'agent.call'; data: XdebugAgentCall }
  | { event: 'breakpoints.changed'; data: XdebugSavedBreakpoint[] }
  | { event: 'breakpoint.resolved'; data: XdebugBreakpointResolved }
