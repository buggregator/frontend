import { describe, expect, it, vi } from 'vitest'
import { downloadingStatus } from '../mocks'
import { UPDATE_PROGRESS_EVENT, dispatchUpdatePublication, onUpdateProgress } from './update-bus'

describe('update bus', () => {
  it('hands the state of an update.progress publication to listeners', () => {
    const listener = vi.fn()
    const stop = onUpdateProgress(listener, { listen: false })

    dispatchUpdatePublication({
      channel: 'events.project.default',
      data: { event: UPDATE_PROGRESS_EVENT, data: downloadingStatus.state },
    })

    expect(listener).toHaveBeenCalledWith(downloadingStatus.state)
    stop()
  })

  it('ignores events and publications without a state', () => {
    const listener = vi.fn()
    const stop = onUpdateProgress(listener, { listen: false })

    dispatchUpdatePublication({ channel: 'events.project.default', data: { event: 'event.received', data: { uuid: 'a' } } })
    dispatchUpdatePublication({ channel: 'events.project.default', data: { event: UPDATE_PROGRESS_EVENT, data: { foo: 1 } } })
    dispatchUpdatePublication({ channel: 'events.project.default' })

    expect(listener).not.toHaveBeenCalled()
    stop()
  })

  it('stops calling a listener that left', () => {
    const listener = vi.fn()
    onUpdateProgress(listener, { listen: false })()

    dispatchUpdatePublication({ data: { event: UPDATE_PROGRESS_EVENT, data: downloadingStatus.state } })

    expect(listener).not.toHaveBeenCalled()
  })
})
