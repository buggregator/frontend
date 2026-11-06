import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import type {
  XdebugAgentCall,
  XdebugAgentCallStarted,
  XdebugBreakpoint,
  XdebugContext,
  XdebugFrame,
  XdebugSession,
  XdebugSource,
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

const DEFAULT_CONTEXTS: XdebugContext[] = [
  { id: 0, name: 'Locals' },
  { id: 1, name: 'Superglobals' },
  { id: 2, name: 'User defined constants' }
]

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

// Everything the page shows for the selected session at its current pause.
// Reads run only while the session is paused (`break`); `running` marks what
// is on screen stale until the next pause replaces it.
export const useXdebugDebugger = (
  api: Omit<XdebugRequests, 'getConfig' | 'getSessions' | 'dismissSession'>,
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

  // Locals of frame 0 at the previous pause, for the «changed» tags.
  let previousLocals: Map<string, string> | null = null
  // Bumped on every reload; an answer of an older generation is dropped.
  let generation = 0
  // State of the last `session.status` seen for this session.
  let lastStatus: string | null = null
  // pause_seq of the last status, when the server sends it.
  let lastPauseSeq: number | null = null

  const id = computed(() => session.value?.id ?? null)
  const paused = computed(() => session.value?.state === 'break')
  const currentFrame = computed(() => stack.value[frame.value] ?? null)

  const guard = <T>(gen: number, apply: (value: T) => void) => (value: T) => {
    if (gen === generation) apply(value)
  }

  const loadSource = async (gen: number, file: string, line: number) => {
    if (!id.value) return
    sourceState.value = 'loading'
    sourceError.value = ''
    try {
      const begin = Math.max(1, line - SOURCE_RADIUS)
      const result = await api.getSource(id.value, file, begin, line + SOURCE_RADIUS)
      guard(gen, (r: XdebugSource) => {
        source.value = r
        sourceState.value = 'ready'
      })(result)
    } catch (e) {
      guard(gen, () => {
        source.value = null
        sourceState.value = 'error'
        sourceError.value = e instanceof XdebugApiError && ['xdebug_error', 'not_found'].includes(e.code)
          ? 'Source not available for this frame (eval\'d code or a file Xdebug cannot read).'
          : errorText(e)
      })(null)
    }
  }

  const loadVariables = async (gen: number) => {
    if (!id.value) return
    varsState.value = 'loading'
    try {
      const vars = await api.getVariables(id.value, { frame: frame.value, context: contextId.value })
      guard(gen, (list: XdebugVar[]) => {
        variables.value = list
        varsState.value = 'ready'
        if (frame.value === 0 && contextId.value === 0) {
          const now = flattenValues(list)
          changed.value = changedNames(previousLocals, now)
          previousLocals = now
        } else {
          changed.value = new Set()
        }
      })(vars)
    } catch (e) {
      guard(gen, () => {
        varsState.value = isNotPaused(e) ? 'idle' : 'error'
      })(null)
    }
  }

  const evaluateWatches = async (gen: number) => {
    if (!id.value || !allowEval.value) return
    const sid = id.value
    await Promise.all(watches.value.map(async (row) => {
      row.state = 'loading'
      try {
        const result = await api.evaluate(sid, row.expression)
        if (gen !== generation) return
        Object.assign(row, { state: 'ready', result, error: undefined })
      } catch (e) {
        if (gen !== generation) return
        Object.assign(row, { state: 'error', result: undefined, error: errorText(e) })
      }
    }))
  }

  const selectFrame = async (level: number) => {
    const gen = ++generation
    frame.value = level
    const f = stack.value[level]
    const jobs: Promise<unknown>[] = [loadVariables(gen)]
    if (f) jobs.push(loadSource(gen, f.file, f.line))
    if (id.value) {
      jobs.push(api.getContexts(id.value, { frame: level })
        .then(guard(gen, (list: XdebugContext[]) => {
          if (list?.length) contexts.value = list
        }))
        .catch(() => {}))
    }
    await Promise.all(jobs)
  }

  const selectContext = async (cid: number) => {
    contextId.value = cid
    await loadVariables(++generation)
  }

  // A fresh pause: new stack, breakpoints, frame 0, watches.
  const loadPause = async () => {
    if (!id.value || !paused.value) return
    const gen = ++generation
    stackState.value = 'loading'
    try {
      const [frames, bps] = await Promise.all([
        api.getStack(id.value),
        api.getBreakpoints(id.value).catch(() => [] as XdebugBreakpoint[])
      ])
      if (gen !== generation) return
      stack.value = frames ?? []
      breakpoints.value = bps
      stackState.value = 'ready'
      stale.value = false
      contextId.value = 0
      await Promise.all([selectFrame(0), evaluateWatches(generation)])
    } catch (e) {
      if (gen === generation) stackState.value = isNotPaused(e) ? 'idle' : 'error'
    }
  }

  const loadAgentLog = async () => {
    if (!id.value) return
    const sid = id.value
    try {
      const log = await api.getAgentLog(sid)
      if (id.value === sid) agentLog.value = log
    } catch {
      // A tombstone or a module restart: the timeline just stays empty.
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
    if (!id.value || !paused.value) return
    const gen = generation
    const result = await api.getProperty(id.value, fullname, { frame: frame.value, context: contextId.value }, page)
    if (gen !== generation) return
    const node = findNode(variables.value, fullname)
    if (!node) return
    const children = result.children ?? []
    node.children = page === 0 ? children : [...(node.children ?? []), ...children]
    node.page = page
    node.pagesize = result.pagesize ?? node.pagesize
    node.numchildren = result.numchildren ?? node.numchildren
  }

  // A cut string: loads the full value (up to 64 KB).
  const showFull = async (fullname: string) => {
    if (!id.value || !paused.value) return
    const gen = generation
    const result = await api.getProperty(id.value, fullname, { frame: frame.value, context: contextId.value })
    if (gen !== generation) return
    const node = findNode(variables.value, fullname)
    if (node) Object.assign(node, { value: result.value, size: result.size })
  }

  const addWatch = (expression: string) => {
    const text = expression.trim()
    if (!text || watches.value.some((w) => w.expression === text)) return
    watches.value.push({ expression: text, state: 'idle' })
    if (paused.value && allowEval.value) {
      const row = watches.value[watches.value.length - 1]
      const gen = generation
      row.state = 'loading'
      api.evaluate(id.value!, text)
        .then((result) => { if (gen === generation) Object.assign(row, { state: 'ready', result }) })
        .catch((e) => { if (gen === generation) Object.assign(row, { state: 'error', error: errorText(e) }) })
    }
  }

  const removeWatch = (expression: string) => {
    watches.value = watches.value.filter((w) => w.expression !== expression)
  }

  const reset = () => {
    generation += 1
    previousLocals = null
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
    watches.value.forEach((w) => Object.assign(w, { state: 'idle', result: undefined, error: undefined }))
  }

  const apply = (message: XdebugWsMessage) => {
    if (!id.value) return
    switch (message.event) {
      case 'session.status': {
        if (message.data.id !== id.value) return
        const { state, file, line, pause_seq: seq } = message.data
        const before = lastStatus
        const seqBefore = lastPauseSeq
        lastStatus = state
        if (seq !== undefined) lastPauseSeq = seq
        if (state !== 'break') {
          if (stack.value.length) stale.value = true
          return
        }
        // The server repeats `break` for every plain Xdebug reply (an eval, a
        // read, the target lookup). Only a pause after running, or a break at
        // another place, is new; else watches would re-evaluate forever.
        if (seq !== undefined && seqBefore !== null) {
          if (seq === seqBefore && !stale.value) return
          queueMicrotask(() => loadPause())
          return
        }
        const top = stack.value[0]
        const moved = !!file && !!line && (!top || top.file !== file || top.line !== line)
        if (before === 'break' && !stale.value && !moved) return
        // The session object updates in the same tick; wait for it.
        queueMicrotask(() => loadPause())
        break
      }
      case 'session.closed':
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

  watch(id, () => {
    reset()
    lastStatus = session.value?.state ?? null
    lastPauseSeq = null
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
    apply
  }
}

export type XdebugDebugger = ReturnType<typeof useXdebugDebugger>
