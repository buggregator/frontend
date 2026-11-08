// Xdebug function trace (xdebug.trace_format=1), uploaded over HTTP.
// Server: modules/xdebugtrace (GitHub server#288).

// Event payload as the events list sends it (the server's preview).
export type XdebugTrace = {
  name: string        // X-Buggregator-Trace-Name, may be empty
  url: string         // X-Buggregator-Trace-Url («GET /users»), may be empty
  main: string        // script of {main}
  duration: number    // seconds
  peak_memory: number // bytes
  calls: number
  max_depth: number
  truncated: boolean  // cut at the size limit, or the trace has no end
  size: number        // bytes stored
  summary?: XdebugTraceSummary // only on the event page: the stored payload carries it
}

// The stored payload, as GET /api/event/{uuid} sends it (the list sends the preview).
export type XdebugTraceStored = {
  file: string
  name: string
  url: string
  size: number
  compressed: boolean
  summary: XdebugTraceSummary
}

export type XdebugTraceFuncStat = {
  func: string
  user: boolean
  count: number
  self: number // seconds
  incl: number // seconds
}

export type XdebugTraceCall = {
  nr: number
  func: string
  file: string
  line: number
  level: number
  start: number
  incl: number
  self: number
  memory: number // bytes, change from entry to exit
  offset: number
}

export type XdebugTraceSummary = {
  calls: number
  user_calls: number
  max_depth: number
  duration: number
  peak_memory: number
  truncated: boolean
  main: string
  top: XdebugTraceFuncStat[]
  slowest: XdebugTraceCall[]
}

export type XdebugTraceSummaryAnswer = {
  name: string
  url: string
  size: number
  compressed: boolean
  summary: XdebugTraceSummary
}

// One ancestor of a search hit, top level first.
export type XdebugTracePathStep = {
  nr: number
  func: string
  offset: number
}

export type XdebugTraceNode = XdebugTraceCall & {
  user: boolean
  include?: string
  args?: string[]
  return?: string
  children: number // direct callees
  done: boolean    // its exit was seen (false when the trace was cut)
  path?: XdebugTracePathStep[] // search hits only
}

export type XdebugTraceTreePage = {
  parent?: XdebugTraceNode
  nodes: XdebugTraceNode[]
  next: number | null
  truncated: boolean
}
