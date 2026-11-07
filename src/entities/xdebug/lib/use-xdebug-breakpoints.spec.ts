import { describe, expect, it, vi } from 'vitest'
import type { XdebugBreakpointDraft, XdebugSavedBreakpoint } from '../types'
import { useXdebugBreakpoints } from './use-xdebug-breakpoints'
import { XdebugApiError } from './use-xdebug-requests'

const F = 'file:///app/src/Cart.php'
const bp = (over: Partial<XdebugSavedBreakpoint> = {}): XdebugSavedBreakpoint => ({
  id: 1, type: 'line', file: F, line: 40, enabled: true, source: 'ui', created_at: '2026-11-07T10:00:00Z', ...over
})

const setup = (initial: XdebugSavedBreakpoint[] = [bp()]) => {
  let next = 10
  const api = {
    listSavedBreakpoints: vi.fn(async () => initial),
    addBreakpoint: vi.fn(async (d: XdebugBreakpointDraft) => bp({ id: next++, ...d } as Partial<XdebugSavedBreakpoint>)),
    updateBreakpoint: vi.fn(async (id: number, patch: object) => bp({ id, ...patch })),
    removeBreakpoint: vi.fn(async () => undefined)
  }
  const onChanged = vi.fn()
  const b = useXdebugBreakpoints(api, onChanged)
  return { b, api, onChanged }
}

describe('useXdebugBreakpoints', () => {
  it('loads the saved list', async () => {
    const { b } = setup()
    await b.load()
    expect(b.state.value).toBe('ready')
    expect(b.list.value.map((x) => x.id)).toEqual([1])
  })

  it('shows an error state when the list does not load', async () => {
    const { b, api } = setup()
    api.listSavedBreakpoints.mockRejectedValueOnce(new Error('down'))
    await b.load()
    expect(b.state.value).toBe('error')
  })

  it('takes the full list from breakpoints.changed', async () => {
    const { b } = setup()
    await b.load()
    b.apply({ event: 'breakpoints.changed', data: [bp({ id: 7, source: 'mcp' })] })
    expect(b.list.value.map((x) => x.id)).toEqual([7])
  })

  it('adds a breakpoint once, even when the channel brought it first', async () => {
    const { b, onChanged } = setup([])
    await b.load()
    const p = b.add({ type: 'line', file: '/app/src/Cart.php', line: 43 })
    b.apply({ event: 'breakpoints.changed', data: [bp({ id: 10, line: 43 })] })
    expect(await p).toBe(true)
    expect(b.list.value.map((x) => x.id)).toEqual([10])
    expect(onChanged).toHaveBeenCalled()
  })

  it('keeps the add error from the server', async () => {
    const { b, api } = setup([])
    api.addBreakpoint.mockRejectedValueOnce(new XdebugApiError('file must be an absolute path', 400, 'bad_request'))
    expect(await b.add({ type: 'line', file: 'app/x.php', line: 1 })).toBe(false)
    expect(b.addError.value).toBe('file must be an absolute path')
  })

  it('toggles a gutter line: removes the one there, else adds', async () => {
    const { b, api } = setup()
    await b.load()
    await b.toggleLine(F, 40)
    expect(api.removeBreakpoint).toHaveBeenCalledWith(1)
    expect(b.list.value).toEqual([])
    await b.toggleLine(F, 41)
    expect(api.addBreakpoint).toHaveBeenCalledWith({ type: 'line', file: F, line: 41 })
  })

  it('switches a breakpoint off at once and back when the server refuses', async () => {
    const { b, api } = setup()
    await b.load()
    let release!: () => void
    api.updateBreakpoint.mockImplementationOnce(() => new Promise((_, rej) => { release = () => rej(new Error('boom')) }))
    const p = b.setEnabled(1, false)
    expect(b.list.value[0].enabled).toBe(false)
    expect(b.busy.value.has(1)).toBe(true)
    release()
    await p
    expect(b.list.value[0].enabled).toBe(true)
    expect(b.busy.value.has(1)).toBe(false)
    expect(b.rowError.value[1]).toMatch(/boom/)
  })

  it('explains a condition refused because eval is off', async () => {
    const { b, api } = setup()
    await b.load()
    api.updateBreakpoint.mockRejectedValueOnce(new XdebugApiError('eval is off', 403, 'eval_disabled'))
    expect(await b.setCondition(1, '$a > 1')).toBe(false)
    expect(b.rowError.value[1]).toMatch(/allow_eval/)
  })

  it('saves a condition and clears it with an empty one', async () => {
    const { b, api } = setup()
    await b.load()
    expect(await b.setCondition(1, ' $a > 1 ')).toBe(true)
    expect(api.updateBreakpoint).toHaveBeenLastCalledWith(1, { condition: '$a > 1' })
    expect(b.list.value[0].condition).toBe('$a > 1')
    await b.setCondition(1, '')
    expect(api.updateBreakpoint).toHaveBeenLastCalledWith(1, { condition: '' })
  })
  it('adds a line once on a double click, before the first reply', async () => {
    const { b, api } = setup([])
    await b.load()
    await Promise.all([b.toggleLine(F, 41), b.toggleLine(F, 41)])
    expect(api.addBreakpoint).toHaveBeenCalledTimes(1)
    expect(b.list.value).toHaveLength(1)
  })

  it('removes a breakpoint saved under another spelling of the file', async () => {
    const { b, api } = setup([bp({ file: 'file:///c:/app/x.php', line: 3 })])
    await b.load()
    await b.toggleLine('file:///C:/app/x.php', 3)
    expect(api.removeBreakpoint).toHaveBeenCalledWith(1)
  })

  it('ignores a second switch while the first is on its way', async () => {
    const { b, api } = setup()
    await b.load()
    let release!: () => void
    api.updateBreakpoint.mockImplementationOnce((id: number, patch: object) => new Promise((res) => { release = () => res(bp({ id, ...patch })) }))
    const p = b.setEnabled(1, false)
    expect(await b.setEnabled(1, true)).toBe(false)
    release()
    await p
    expect(api.updateBreakpoint).toHaveBeenCalledTimes(1)
    expect(b.list.value[0].enabled).toBe(false)
  })

  it('clears the add error when asked (the user types again)', async () => {
    const { b, api } = setup([])
    api.addBreakpoint.mockRejectedValueOnce(new Error('bad'))
    await b.add({ type: 'exception', exception: 'X' })
    b.clearAddError()
    expect(b.addError.value).toBe('')
  })
})
