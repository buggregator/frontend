import { describe, expect, it } from 'vitest'
import { EventTypes, type ServerEvent } from '@/shared/types'
import { xdebugTraceMock } from '../mocks'
import type { XdebugTrace, XdebugTraceStored, XdebugTraceSummary } from '../types'
import { normalizeXdebugTraceEvent } from './normalize-xdebug-trace-event'

const summary: XdebugTraceSummary = {
  calls: 929, user_calls: 100, max_depth: 6, duration: 0.21, peak_memory: 967568,
  truncated: true, main: '/app/public/index.php', top: [], slowest: [],
}

describe('normalizeXdebugTraceEvent', () => {
  it('keeps the preview the list sends', () => {
    const event = normalizeXdebugTraceEvent(xdebugTraceMock as ServerEvent<XdebugTrace>)
    expect(event.type).toBe(EventTypes.XdebugTrace)
    expect(event.payload).toEqual(xdebugTraceMock.payload)
  })

  it('turns the stored payload of the event page into the preview and keeps its summary', () => {
    const stored: ServerEvent<XdebugTraceStored> = {
      uuid: 'id-1', type: EventTypes.XdebugTrace, project: 'default', timestamp: 1731070000,
      payload: { file: 'id-1.xt.gz', name: 'users', url: 'GET /users', size: 25619, compressed: true, summary },
    }

    expect(normalizeXdebugTraceEvent(stored).payload).toEqual({
      name: 'users', url: 'GET /users', main: '/app/public/index.php', duration: 0.21,
      peak_memory: 967568, calls: 929, max_depth: 6, truncated: true, size: 25619, summary,
    })
  })
})
