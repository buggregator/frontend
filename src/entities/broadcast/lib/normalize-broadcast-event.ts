import { normalizeEvent } from '@/shared/lib/normalize-event'
import { EventTypes } from '@/shared/types'
import type { ServerEvent, NormalizedEvent } from '@/shared/types'
import type { BroadcastPayload } from '../types'

export const normalizeBroadcastEvent = (event: ServerEvent<BroadcastPayload>): NormalizedEvent<BroadcastPayload> =>
  normalizeEvent(event, { type: EventTypes.Broadcast, labels: [EventTypes.Broadcast] })
