import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import type {
  XdebugAgentCall,
  XdebugAgentCallStarted,
  XdebugBreakpoint,
  XdebugContext,
  XdebugFrame,
  XdebugSession,
  XdebugSource,
  XdebugStatusUpdate,
  XdebugVar,
  XdebugWsMessage
} from '../types'
import { isNotPaused, XdebugApiError, type XdebugRequests } from './use-xdebug-requests'
import { changedNames, flattenValues } from './xdebug-format'

// Lines of source asked around the paused line.
export const SOURCE_RADIUS = 60

export type PanelState = 'idle' | 'loading' | 'ready' | 'error'

export type WatchRow = {
  expression: string
  state: 'idle' | 'loading' | 'ready' | 'error'
  result?: XdebugVar
  error?: string
}

type WatchResult = { key: string; state: 'loading' | 'ready' | 'error'; result?: XdebugVar; error?: string }

// What the page knows about one session's pause, from status events and loads.
type PauseInfo = { state: string; key: string | null; seq?: number; file?: string; line?: number }

const DEFAULT_CONTEXTS: XdebugContext[] = [
  { id: 0, name: 'Locals' },
  { id: 1, name: 'Superglobals' },
  { id: 2, name: 'User defined constants' }
]

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

// Everything the page shows for the selected session at its current pause.
// Reads run only while the session is paused (`break`); `running` marks what
// is on screen stale until the next pause replaces it.
//
// Eval runs code in the debugged PHP process, so each watch is evaluated at
// most once per session and pause: results are kept per session under the
// pause key, and switching sessions or re-reading a pause reuses them.
export const useXdebugDebugger = (
  api: Omit<XdebugRequests, 'getConfig' | 'getSessions' | 'dismissSession' | 'control' | 'putSettings'>,
  session: Ref<XdebugSession | null>,
  allowEval: Ref<boolean>
) => {
  const stack = ref<XdebugFrame[]>([])
  const stackState = ref<PanelState>('idle')
  const frame = ref(0)
  const contexts = ref<XdebugContext[]>(DEFAULT_CONTEXTS)
  const contextId = ref(0)
  const variables = ref<XdebugVar[]>([])
  const varsState = ref<PanelState>('idle')
  const source = shallowRef<XdebugSource | null>(null)
  const sourceState = ref<PanelState>('idle')
  const sourceError = ref('')
  const breakpoints = ref<XdebugBreakpoint[]>([])
  const agentLog = ref<XdebugAgentCall[]>([])
  const inflight = ref<XdebugAgentCallStarted | null>(null)
  const stale = ref(false)
  const changed = ref<Set<string>>(new Set())
  const watches = ref<WatchRow[]>([])

  // One token per panel: an answer is applied only while its token is current,
  // so a frame click does not drop watch replies and a context click does not
  // drop the frame's source.
  const tokens = { pause: 0, vars: 0, source: 0, ctx: 0 }
  const pauses = new Map<string, PauseInfo>()
  const evaluated = new Map<string, Map<string, WatchResult>>()
  const pendingPages = new Set<string>()
  // Locals of frame 0, taken once per pause, for the «changed» tags.
  let localsNow: { key: string; values: Map<string, string> } | null = null
  let localsBefore: Map<string, string> | null = null
  let eventCounter = 0

  const id = computed(() => session.value?.id ?? null)
  const paused = computed(() => session.value?.state === 'break')
  const currentFrame = computed(() => stack.value[frame.value] ?? null)

  const pauseKey = (sid: string) => {
    const info = pauses.get(sid)
    if (info?.key) return info.key
    const key = `at:${session.value?.paused_at ?? ''}`
    pauses.set(sid, { ...(info ?? { state: 'break' }), key })
    return key
  }

  // ---- watches -------------------------------------------------------------

  const showWatch = (row: WatchRow, r: WatchResult | undefined) => {
    Object.assign(row, r
      ? { state: r.state, result: r.result, error: r.error }
      : { state: 'idle', result: undefined, error: undefined })
  }

  const showWatches = () => {
    const sid = id.value
    const key = sid ? pauses.get(sid)?.key : null
    const results = sid ? evaluated.get(sid) : undefined
    watches.value.forEach((row) => {
      const r = results?.get(row.expression)
      showWatch(row, r && r.key === key ? r : undefined)
    })
  }

  // Evaluates the watches not yet evaluated at this session's current pause.
  const runWatches = () => {
    const sid = id.value
    if (!sid || !paused.value || !allowEval.value) return
    const key = pauseKey(sid)
    if (!evaluated.has(sid)) evaluated.set(sid, new Map())
    const results = evaluated.get(sid)!
    watches.value.forEach((row) => {
      const known = results.get(row.expression)
      if (known && known.key === key) {
        showWatch(row, known)
        return
      }
      const entry: WatchResult = { key, state: 'loading' }
      results.set(row.expression, entry)
      showWatch(row, entry)
      api.evaluate(sid, row.expression)
        .then((result) => Object.assign(entry, { state: 'ready', result }))
        .catch((e) => Object.assign(entry, { state: 'error', error: errorText(e) }))
        .finally(() => {
          if (id.value === sid && results.get(row.expression) === entry) {
            const visible = watches.value.find((w) => w.expression === row.expression)
            if (visible) showWatch(visible, entry)
          }
        })
    })
  }

  // ---- panels --------------------------------------------------------------

  const loadSource = async (file: string, line: number) => {
    const sid = id.value
    if (!sid) return
    const t = ++tokens.source
    sourceState.value = 'loading'
    sourceError.value = ''
    try {
      const begin = Math.max(1, line - SOURCE_RADIUS)
      const result = await api.getSource(sid, file, begin, line + SOURCE_RADIUS)
      if (t !== tokens.source) return
      source.value = result
      sourceState.value = 'ready'
    } catch (e) {
      if (t !== tokens.source) return
      source.value = null
      sourceState.value = 'error'
      sourceError.value = e instanceof XdebugApiError && ['xdebug_error', 'not_found'].includes(e.code)
        ? 'Source not available for this frame (eval\'d code or a file Xdebug cannot read).'
        : errorText(e)
    }
  }

  const loadVariables = async () => {
    const sid = id.value
    if (!sid) return
    const t = ++tokens.vars
    const at = { frame: frame.value, context: contextId.value }
    varsState.value = 'loading'
    try {
      const list = await api.getVariables(sid, at)
      if (t !== tokens.vars) return
      variables.value = list
      varsState.value = 'ready'
      if (at.frame !== 0 || at.context !== 0) {
        changed.value = new Set()
        return
      }
      const key = pauseKey(sid)
      if (localsNow?.key !== key) {
        localsBefore = localsNow?.values ?? null
        localsNow = { key, values: flattenValues(list) }
      }
      changed.value = changedNames(localsBefore, localsNow.values)
    } catch (e) {
      if (t !== tokens.vars) return
      varsState.value = isNotPaused(e) ? 'idle' : 'error'
    }
  }

  const loadContexts = async (level: number) => {
    const sid = id.value
    if (!sid) return
    const t = ++tokens.ctx
    try {
      const list = await api.getContexts(sid, { frame: level })
      if (t === tokens.ctx && list?.length) contexts.value = list
    } catch {
      // The default three scopes stay.
    }
  }

  const selectFrame = async (level: number) => {
    if (!paused.value) return
    frame.value = level
    const f = stack.value[level]
    await Promise.all([loadVariables(), f ? loadSource(f.file, f.line) : null, loadContexts(level)])
  }

  const selectContext = async (cid: number) => {
    if (!paused.value) return
    contextId.value = cid
    await loadVariables()
  }

  // A pause: stack, breakpoints, frame 0; watches only if not yet run here.
  const loadPause = async () => {
    const sid = id.value
    if (!sid || !paused.value) return
    const t = ++tokens.pause
    stackState.value = 'loading'
    try {
      const [frames, bps] = await Promise.all([
        api.getStack(sid),
        api.getBreakpoints(sid).catch(() => [] as XdebugBreakpoint[])
      ])
      if (t !== tokens.pause) return
      stack.value = frames ?? []
      breakpoints.value = bps
      stackState.value = 'ready'
      stale.value = false
      contextId.value = 0
      const top = stack.value[0]
      const info = pauses.get(sid)
      pauses.set(sid, { ...(info ?? {}), state: 'break', key: pauseKey(sid), file: top?.file, line: top?.line })
      runWatches()
      await selectFrame(0)
    } catch (e) {
      if (t === tokens.pause) stackState.value = isNotPaused(e) ? 'idle' : 'error'
    }
  }

  const loadAgentLog = async () => {
    const sid = id.value
    if (!sid) return
    try {
      const log = await api.getAgentLog(sid)
      if (id.value !== sid) return
      // Calls that came over the channel while the request was in flight stay.
      const bySeq = new Map([...log, ...agentLog.value].map((c) => [c.seq, c]))
      agentLog.value = [...bySeq.values()].sort((a, b) => a.seq - b.seq)
    } catch {
      // A tombstone or a module restart: the timeline just stays as it is.
    }
  }

  const findNode = (list: XdebugVar[], fullname: string): XdebugVar | null => {
    for (const v of list) {
      if (v.fullname === fullname) return v
      const hit = v.children ? findNode(v.children, fullname) : null
      if (hit) return hit
    }
    return null
  }

  // Loads children of an object or array (page 0), or the next page.
  const expand = async (fullname: string, page = 0) => {
    const sid = id.value
    const pending = `${fullname}#${page}`
    if (!sid || !paused.value || pendingPages.has(pending)) return
    const t = tokens.vars
    pendingPages.add(pending)
    try {
      const result = await api.getProperty(sid, fullname, { frame: frame.value, context: contextId.value }, page)
      if (t !== tokens.vars) return
      const node = findNode(variables.value, fullname)
      if (!node || (page > 0 && (node.page ?? 0) >= page)) return
      const children = result.children ?? []
      node.children = page === 0 ? children : [...(node.children ?? []), ...children]
      node.page = page
      node.pagesize = result.pagesize ?? node.pagesize
      node.numchildren = result.numchildren ?? node.numchildren
    } finally {
      pendingPages.delete(pending)
    }
  }

  // A cut string: loads the value up to the server's cap (64 KB).
  const showFull = async (fullname: string) => {
    const sid = id.value
    if (!sid || !paused.value) return
    const t = tokens.vars
    const result = await api.getProperty(sid, fullname, { frame: frame.value, context: contextId.value })
    if (t !== tokens.vars) return
    const node = findNode(variables.value, fullname)
    // No `size` any more means the value is whole; if the server cut it again,
    // keep its size so the row says the value is capped.
    if (node) Object.assign(node, { value: result.value, size: result.size, full: true })
  }

  const addWatch = (expression: string) => {
    const text = expression.trim()
    if (!text || watches.value.some((w) => w.expression === text)) return
    watches.value.push({ expression: text, state: 'idle' })
    // Before the stack has loaded, loadPause runs the new watch itself.
    if (stackState.value === 'ready') runWatches()
  }

  const removeWatch = (expression: string) => {
    watches.value = watches.value.filter((w) => w.expression !== expression)
    evaluated.forEach((results) => results.delete(expression))
  }

  const reset = () => {
    tokens.pause += 1
    tokens.vars += 1
    tokens.source += 1
    tokens.ctx += 1
    localsNow = null
    localsBefore = null
    stack.value = []
    stackState.value = 'idle'
    frame.value = 0
    contexts.value = DEFAULT_CONTEXTS
    contextId.value = 0
    variables.value = []
    varsState.value = 'idle'
    source.value = null
    sourceState.value = 'idle'
    sourceError.value = ''
    breakpoints.value = []
    agentLog.value = []
    inflight.value = null
    stale.value = false
    changed.value = new Set()
    showWatches()
  }

  // Tracks every session's pause. A `break` is a new pause when the session
  // was not paused, `pause_seq` changed, or (servers without pause_seq) the
  // location moved. The server also repeats `break` within one pause.
  const track = (ev: XdebugStatusUpdate): boolean => {
    const prev = pauses.get(ev.id)
    if (ev.state !== 'break') {
      pauses.set(ev.id, { state: ev.state, key: null })
      return false
    }
    const moved = !!ev.file && !!ev.line && (prev?.file !== ev.file || prev?.line !== ev.line)
    const isNew = !prev || prev.state !== 'break' ||
      (ev.pause_seq !== undefined && prev.seq !== undefined ? ev.pause_seq !== prev.seq : moved)
    const key = isNew
      ? (ev.pause_seq !== undefined ? `seq:${ev.pause_seq}` : `ev:${++eventCounter}`)
      : prev?.key ?? null
    pauses.set(ev.id, { state: 'break', key, seq: ev.pause_seq ?? prev?.seq, file: ev.file ?? prev?.file, line: ev.line ?? prev?.line })
    return isNew
  }

  const apply = (message: XdebugWsMessage) => {
    switch (message.event) {
      case 'session.status': {
        const isNew = track(message.data)
        if (message.data.id !== id.value) return
        if (message.data.state !== 'break') {
          if (stack.value.length) stale.value = true
          return
        }
        // The session object updates in the same tick; wait for it.
        if (isNew || stale.value) queueMicrotask(() => loadPause())
        break
      }
      case 'session.closed':
        pauses.set(message.data.id, { state: message.data.state, key: null })
        evaluated.delete(message.data.id)
        if (message.data.id === id.value && stack.value.length) stale.value = true
        break
      case 'agent.call.started':
        if (message.data.session_id === id.value) inflight.value = message.data
        break
      case 'agent.call':
        if (message.data.session_id !== id.value) return
        if (!agentLog.value.some((c) => c.seq === message.data.seq)) agentLog.value = [...agentLog.value, message.data]
        inflight.value = null
        break
      default:
        break
    }
  }

  // After a dropped connection: re-read what may have changed meanwhile.
  const refresh = () => {
    loadAgentLog()
    if (paused.value) loadPause()
  }

  watch(id, () => {
    reset()
    loadAgentLog()
    loadPause()
  }, { immediate: true })

  return {
    stack,
    stackState,
    frame,
    currentFrame,
    contexts,
    contextId,
    variables,
    varsState,
    source,
    sourceState,
    sourceError,
    breakpoints,
    agentLog,
    inflight,
    stale,
    changed,
    watches,
    paused,
    selectFrame,
    selectContext,
    loadPause,
    expand,
    showFull,
    addWatch,
    removeWatch,
    refresh,
    apply
  }
}

export type XdebugDebugger = ReturnType<typeof useXdebugDebugger>
