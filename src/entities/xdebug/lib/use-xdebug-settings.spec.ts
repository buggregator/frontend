import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { XdebugConfig } from '../types'
import { XdebugApiError } from './use-xdebug-requests'
import { useXdebugSettings } from './use-xdebug-settings'

const cfg = (over: Partial<XdebugConfig> = {}): XdebugConfig => ({
  enabled: true, addr: '127.0.0.1:9003', ide_addr: '127.0.0.1:9004', allow_eval: false,
  mode: 'auto', pause_on_first_line: false, idle_timeout_seconds: 600, ...over
})

const setup = (config = cfg(), putSettings = vi.fn(async (b: object) => ({ mode: 'auto' as const, pause_on_first_line: false, idle_timeout_seconds: 600, ...b }))) => {
  const onSaved = vi.fn()
  const st = useXdebugSettings({ putSettings }, ref(config), onSaved)
  return { st, putSettings, onSaved }
}

describe('useXdebugSettings', () => {
  it('starts the draft from the server values on open', () => {
    const { st } = setup(cfg({ mode: 'standalone', pause_on_first_line: true }))
    st.open()
    expect(st.draft.value).toEqual({ mode: 'standalone', pause_on_first_line: true })
    expect(st.dirty.value).toBe(false)
  })

  it('sends only what changed and hands the saved values on', async () => {
    const { st, putSettings, onSaved } = setup()
    st.open()
    st.draft.value.mode = 'standalone'

    expect(st.dirty.value).toBe(true)
    expect(await st.save()).toBe(true)
    expect(putSettings).toHaveBeenCalledWith({ mode: 'standalone' })
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ mode: 'standalone' }))
  })

  it('saves nothing when nothing changed', async () => {
    const { st, putSettings } = setup()
    st.open()
    expect(await st.save()).toBe(true)
    expect(putSettings).not.toHaveBeenCalled()
  })

  it('keeps the draft and shows the error when the server refuses', async () => {
    const { st } = setup(cfg(), vi.fn(async () => { throw new XdebugApiError('unknown mode "x"', 400, 'bad_request') }))
    st.open()
    st.draft.value.pause_on_first_line = true

    expect(await st.save()).toBe(false)
    expect(st.error.value).toBe('Could not save: unknown mode "x"')
    expect(st.draft.value.pause_on_first_line).toBe(true)
    expect(st.saving.value).toBe(false)
  })
})
