import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import type { Monolog } from '@/entities/monolog'
import { useEventsStore, useSettingsStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import { logLine } from './test-utils'
import { useLogsStream } from './use-logs-stream'

describe('useLogsStream', () => {
  let store: ReturnType<typeof useEventsStore>
  const onLines = vi.fn()
  const matches = (e: ServerEvent<Monolog>) => e.payload.level >= 400

  beforeEach(() => {
    setActivePinia(createPinia())
    useSettingsStore().availableEvents = ['monolog', 'smtp']
    store = useEventsStore()
    store.setActiveProjectKey('default')
    onLines.mockClear()
  })

  const start = () => effectScope().run(() => useLogsStream({ matches, onLines }))!

  it('passes new Monolog lines of the project on, oldest first', () => {
    start()
    const a = logLine('a')
    const b = logLine('b')
    store.addList([a, { ...logLine('x'), type: 'smtp' }, logLine('y', {}, { project: 'other' }), b])
    expect(onLines).toHaveBeenCalledWith([a, b])
  })

  it('paused: buffers the lines and counts the ones that match', () => {
    const s = start()
    s.setPaused(true)
    store.addList([logLine('a', { level: 400 }), logLine('b'), logLine('c')])
    store.addList([logLine('c'), logLine('d', { level: 500 })])
    expect(onLines).not.toHaveBeenCalled()
    expect(s.bufferedCount.value).toBe(4)
    expect(s.bufferedMatchCount.value).toBe(2)
  })

  it('show them: the buffer goes on screen oldest first and the stream is live again', () => {
    const s = start()
    s.setPaused(true)
    store.addList([logLine('a'), logLine('b')])
    s.showBuffered()
    expect(onLines).toHaveBeenCalledWith([
      expect.objectContaining({ uuid: 'a' }),
      expect.objectContaining({ uuid: 'b' })
    ])
    expect(s.paused.value).toBe(false)
    expect(s.bufferedCount.value).toBe(0)
  })

  it('stops listening with its scope', () => {
    const scope = effectScope()
    scope.run(() => useLogsStream({ matches, onLines }))
    scope.stop()
    store.addList([logLine('a')])
    expect(onLines).not.toHaveBeenCalled()
  })
})
