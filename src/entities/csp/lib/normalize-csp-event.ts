import { normalizeEvent } from '@/shared/lib/normalize-event'
import { EventTypes, type NormalizedEvent, type ServerEvent } from '@/shared/types'
import type { CspPayload } from '../types'

export const normalizeCspEvent = (event: ServerEvent<CspPayload>): NormalizedEvent<CspPayload> =>
  normalizeEvent(event, { type: EventTypes.Csp, labels: [EventTypes.Csp] })
