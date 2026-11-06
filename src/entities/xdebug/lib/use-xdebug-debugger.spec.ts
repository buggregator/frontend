import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import type { XdebugSession, XdebugVar } from '../types'
import { useXdebugDebugger } from './use-xdebug-debugger'
import { XdebugApiError } from './use-xdebug-requests'

const v = (name: string, value: string, over: Partial<XdebugVar> = {}): XdebugVar =>
  ({ name, fullname: name, type: 'int', value, ...over })

const frames = [
  { level: 0, where: 'CartService->applyDiscount', file: 'file:///app/Cart.php', line: 43, vendor: false },
  { level: 1, where: 'CartService->total', file: 'file:///app/Cart.php', line: 34, vendor: false }
]

const makeApi = () => {
  let locals: XdebugVar[] = [v('$a', '1'), v('$b', '2')]
  return {
    setLocals: (list: XdebugVar[]) => { locals = list },
    getStack: vi.fn(async () => frames),
    getContexts: vi.fn(async () => [{ id: 0, name: 'Locals' }]),
    getVariables: vi.fn(async (_id: string, { frame }: { frame: number }) => (frame === 0 ? locals : [v('$cart', 'x')])),
    getProperty: vi.fn(async (_id: string, name: string, _f: unknown, page = 0) => ({
      ...v(name, ''), type: 'array', numchildren: 3, pagesize: 2,
      children: page === 0 ? [v(`${name}[0]`, '0'), v(`${name}[1]`, '1')] : [v(`${name}[2]`, '2')]
    })),
    getSource: vi.fn(async (_id: string, file: string, begin: number) => ({ file, begin, lines: [{ line: begin, text: '<?php' }] })),
    getBreakpoints: vi.fn(async () => [{ id: '1', type: 'line', state: 'enabled', file: 'file:///app/Cart.php', line: 43 }]),
    getAgentLog: vi.fn(async () => []),
    evaluate: vi.fn(async (_id: string, expression: string) => v(expression, '42'))
  }
}

const setup = (state: XdebugSession['state'] = 'break', allowEval = false) => {
  const api = makeApi()
  const session = ref<XdebugSession | null>({ id: '1', state, ide_connected: true, agent_calls: 0 })
  const scope = effectScope()
  const dbg = scope.run(() => useXdebugDebugger(api, session, ref(allowEval)))!
  return { api, session, dbg }
}

describe('useXdebugDebugger', () => {
  it('loads stack, frame 0 variables and source around the paused line', async () => {
    const { api, dbg } = setup()
    await flushPromises()

    expect(dbg.stack.value).toHaveLength(2)
    expect(dbg.variables.value.map((x) => x.name)).toEqual(['$a', '$b'])
    expect(api.getSource).toHaveBeenCalledWith('1', 'file:///app/Cart.php', 1, 103)
    expect(dbg.breakpoints.value).toHaveLength(1)
    expect(dbg.stale.value).toBe(false)
  })

  it('reads nothing while the script runs', async () => {
    const { api, dbg } = setup('running')
    await flushPromises()

    expect(api.getStack).not.toHaveBeenCalled()
    expect(dbg.stackState.value).toBe('idle')
    expect(api.getAgentLog).toHaveBeenCalledWith('1')
  })

  it('marks values stale on running and reloads with «changed» tags on the next pause', async () => {
    const { api, session, dbg } = setup()
    await flushPromises()

    session.value = { ...session.value!, state: 'running' }
    dbg.apply({ event: 'session.status', data: { id: '1', state: 'running' } })
    expect(dbg.stale.value).toBe(true)

    api.setLocals([v('$a', '5'), v('$b', '2')])
    session.value = { ...session.value!, state: 'break' }
    dbg.apply({ event: 'session.status', data: { id: '1', state: 'break', line: 44 } })
    await flushPromises()

    expect(dbg.stale.value).toBe(false)
    expect([...dbg.changed.value]).toEqual(['$a'])
  })

  // The server repeats `break` for every plain Xdebug reply (eval, a cold
  // read, the target lookup); re-reading on each one looped with watches.
  it('reloads only on a new pause, not on a repeated break at the same place', async () => {
    const { api, dbg } = setup('break', true)
    dbg.addWatch('$a')
    await flushPromises()
    const stackCalls = api.getStack.mock.calls.length
    const evalCalls = api.evaluate.mock.calls.length

    dbg.apply({ event: 'session.status', data: { id: '1', state: 'break', file: 'file:///app/Cart.php', line: 43 } })
    dbg.apply({ event: 'session.status', data: { id: '1', state: 'break', file: 'file:///app/Cart.php', line: 43, kind: 'http', target: 'GET /' } })
    await flushPromises()
    expect(api.getStack.mock.calls.length).toBe(stackCalls)
    expect(api.evaluate.mock.calls.length).toBe(evalCalls)
    expect(dbg.watches.value[0].state).toBe('ready')

    // A break somewhere else is a new pause even if `running` was missed.
    dbg.apply({ event: 'session.status', data: { id: '1', state: 'break', file: 'file:///app/Cart.php', line: 44 } })
    await flushPromises()
    expect(api.getStack.mock.calls.length).toBe(stackCalls + 1)
  })

  it('follows pause_seq when the server sends it', async () => {
    const { api, dbg } = setup()
    await flushPromises()
    const at = { id: '1', state: 'break' as const, file: 'file:///app/Cart.php', line: 43 }

    dbg.apply({ event: 'session.status', data: { ...at, pause_seq: 1 } })
    await flushPromises()
    const calls = api.getStack.mock.calls.length
    dbg.apply({ event: 'session.status', data: { ...at, pause_seq: 1, target: 'GET /' } })
    await flushPromises()
    expect(api.getStack.mock.calls.length).toBe(calls)

    // Same line, new pause (a breakpoint inside a loop).
    dbg.apply({ event: 'session.status', data: { ...at, pause_seq: 2 } })
    await flushPromises()
    expect(api.getStack.mock.calls.length).toBe(calls + 1)
  })

  it('selecting another frame reloads its variables and source', async () => {
    const { api, dbg } = setup()
    await flushPromises()

    await dbg.selectFrame(1)

    expect(api.getVariables).toHaveBeenLastCalledWith('1', { frame: 1, context: 0 })
    expect(api.getSource).toHaveBeenLastCalledWith('1', 'file:///app/Cart.php', 1, 94)
    expect(dbg.variables.value.map((x) => x.name)).toEqual(['$cart'])
    expect(dbg.changed.value.size).toBe(0)
  })

  it('says when the source of a frame is not available', async () => {
    const { api, dbg } = setup()
    api.getSource.mockRejectedValueOnce(new XdebugApiError('no source', 422, 'xdebug_error'))
    await flushPromises()

    expect(dbg.sourceState.value).toBe('error')
    expect(dbg.sourceError.value).toMatch(/Source not available/)
  })

  it('expands a node and pages its children', async () => {
    const { api, dbg } = setup()
    api.setLocals([v('$items', '', { type: 'array', numchildren: 3 })])
    await flushPromises()

    await dbg.expand('$items')
    await dbg.expand('$items', 1)

    expect(dbg.variables.value[0].children?.map((x) => x.name)).toEqual(['$items[0]', '$items[1]', '$items[2]'])
  })

  it('keeps the agent log live and clears the «reading» row', async () => {
    const { dbg } = setup()
    await flushPromises()

    dbg.apply({ event: 'agent.call.started', data: { session_id: '1', tool: 'xdebug_stack', args: '', at: 'now' } })
    expect(dbg.inflight.value?.tool).toBe('xdebug_stack')

    const call = { seq: 1, session_id: '1', at: 'now', tool: 'xdebug_stack', args: '', ok: true, result_summary: '2 frames', duration_ms: 3 }
    dbg.apply({ event: 'agent.call', data: call })
    dbg.apply({ event: 'agent.call', data: call })

    expect(dbg.agentLog.value).toHaveLength(1)
    expect(dbg.inflight.value).toBeNull()
  })

  it('evaluates watches on each pause only when eval is on', async () => {
    const off = setup('break', false)
    off.dbg.addWatch('count($items)')
    await flushPromises()
    expect(off.api.evaluate).not.toHaveBeenCalled()

    const on = setup('break', true)
    on.dbg.addWatch('count($items)')
    await flushPromises()
    expect(on.dbg.watches.value[0]).toMatchObject({ state: 'ready', result: { value: '42' } })
  })
})
