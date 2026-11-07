import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import type { XdebugCommand, XdebugSession } from '../types'
import { useXdebugControl } from './use-xdebug-control'
import { XdebugApiError } from './use-xdebug-requests'

const NOW = Date.parse('2026-11-07T12:00:00Z')

const s = (over: Partial<XdebugSession> = {}): XdebugSession =>
  ({ id: '1', state: 'break', ide_connected: false, agent_calls: 0, driver: 'here', ...over })

const setup = (session: XdebugSession | null = s(), control = vi.fn(async (id: string) => s({ id, state: 'running' }))) => {
  const current = ref<XdebugSession | null>(session)
  const now = ref(NOW)
  const onInfo = vi.fn()
  const scope = effectScope()
  const ctl = scope.run(() => useXdebugControl({ control }, current, now, onInfo))!
  return { ctl, current, now, control, onInfo }
}

describe('useXdebugControl', () => {
  it('lets the page drive only a paused session driven here', () => {
    const { ctl, current } = setup()
    expect(ctl.canControl.value).toBe(true)

    current.value = s({ state: 'running' })
    expect(ctl.canControl.value).toBe(false)

    current.value = s({ driver: 'ide', ide_connected: true })
    expect(ctl.canControl.value).toBe(false)
    expect(ctl.drivenByIde.value).toBe(true)

    current.value = null
    expect(ctl.canControl.value).toBe(false)
  })

  it('sends the command, hands the reply to the list, blocks a second one meanwhile', async () => {
    let finish: (v: XdebugSession) => void = () => {}
    const control = vi.fn((_id: string, _c: XdebugCommand) => new Promise<XdebugSession>((r) => { finish = r }))
    const { ctl, onInfo } = setup(s(), control)

    const sent = ctl.send('step-over')
    expect(ctl.pending.value).toBe('step-over')
    expect(ctl.canControl.value).toBe(false)
    await ctl.send('run')
    expect(control).toHaveBeenCalledTimes(1)

    finish(s({ state: 'running', last_continuation_by: 'ui' }))
    await sent
    expect(control).toHaveBeenCalledWith('1', 'step-over')
    expect(onInfo).toHaveBeenCalledWith(expect.objectContaining({ state: 'running' }))
    expect(ctl.pending.value).toBeNull()
  })

  it('says why a command failed and clears it on dismiss or another session', async () => {
    const control = vi.fn(async () => { throw new XdebugApiError('not paused', 409, 'not_paused', 'stopped') })
    const { ctl, current } = setup(s(), control)

    await ctl.send('step-over')
    expect(ctl.error.value).toBe('Step over failed: the script already ended (Xdebug closed the connection).')

    ctl.dismissError()
    expect(ctl.error.value).toBe('')

    await ctl.send('run')
    current.value = s({ id: '2' })
    await flushPromises()
    expect(ctl.error.value).toBe('')
  })

  it('maps the other refusals to plain words', async () => {
    const fail = (e: Error) => setup(s(), vi.fn(async () => { throw e }))

    const ide = fail(new XdebugApiError('x', 409, 'ide_attached'))
    await ide.ctl.send('run')
    expect(ide.ctl.error.value).toBe('Continue failed: an IDE drives this session. Step in your IDE.')

    const running = fail(new XdebugApiError('x', 409, 'not_paused', 'running'))
    await running.ctl.send('detach')
    expect(running.ctl.error.value).toBe('Release failed: the script is not paused.')

    const other = fail(new XdebugApiError('write: broken pipe', 502, 'xdebug_failed'))
    await other.ctl.send('stop')
    expect(other.ctl.error.value).toBe('Stop failed: write: broken pipe')
  })

  it('counts down to the idle deadline the server gave', () => {
    const { ctl, current, now } = setup(s({ idle_deadline: new Date(NOW + 9 * 60_000 + 12_000).toISOString() }))
    expect(ctl.idleLeft.value).toBe('9:12')

    now.value = NOW + 9 * 60_000 + 5_000
    expect(ctl.idleLeft.value).toBe('0:07')

    now.value = NOW + 20 * 60_000
    expect(ctl.idleLeft.value).toBe('0:00')

    current.value = s({ idle_deadline: null })
    expect(ctl.idleLeft.value).toBe('')
  })

  it('names who sent the last continuation', () => {
    const { ctl, current } = setup(s({ last_continuation_by: 'ui' }))
    expect(ctl.lastBy.value).toBe('You')

    current.value = s({ last_continuation_by: 'agent', last_continuation_agent: 'claude-07' })
    expect(ctl.lastBy.value).toBe('agent claude-07')

    current.value = s({ last_continuation_by: 'agent' })
    expect(ctl.lastBy.value).toBe('an agent')

    current.value = s({ last_continuation_by: null })
    expect(ctl.lastBy.value).toBe('')
  })
})
