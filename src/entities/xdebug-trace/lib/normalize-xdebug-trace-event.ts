import { normalizeEvent } from '@/shared/lib/normalize-event'
import { type ServerEvent, type NormalizedEvent, EventTypes } from '@/shared/types'
import type { XdebugTrace } from '../types'

export const normalizeXdebugTraceEvent = (event: ServerEvent<XdebugTrace>): NormalizedEvent<XdebugTrace> =>
  normalizeEvent(event, {
    type: EventTypes.XdebugTrace,
    labels: [EventTypes.XdebugTrace],
  })
