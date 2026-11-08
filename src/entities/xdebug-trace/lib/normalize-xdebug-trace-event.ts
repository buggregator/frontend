import { normalizeEvent } from '@/shared/lib/normalize-event'
import { type ServerEvent, type NormalizedEvent, EventTypes } from '@/shared/types'
import type { XdebugTrace, XdebugTraceStored } from '../types'

const isStored = (payload: XdebugTrace | XdebugTraceStored): payload is XdebugTraceStored =>
  typeof (payload as XdebugTraceStored).summary === 'object' && (payload as XdebugTraceStored).summary !== null

// The list and the live feed send the preview; the event page gets the stored
// payload with the summary inside. Both become the preview shape, the page
// keeps the summary so it does not ask for it again.
const toPreview = (payload: XdebugTrace | XdebugTraceStored): XdebugTrace => {
  if (!isStored(payload)) return payload
  const { summary } = payload
  return {
    name: payload.name,
    url: payload.url,
    main: summary.main,
    duration: summary.duration,
    peak_memory: summary.peak_memory,
    calls: summary.calls,
    max_depth: summary.max_depth,
    truncated: summary.truncated,
    size: payload.size,
    summary,
  }
}

export const normalizeXdebugTraceEvent = (
  event: ServerEvent<XdebugTrace | XdebugTraceStored>,
): NormalizedEvent<XdebugTrace> =>
  normalizeEvent({ ...event, payload: toPreview(event.payload) }, {
    type: EventTypes.XdebugTrace,
    labels: [EventTypes.XdebugTrace],
  })
