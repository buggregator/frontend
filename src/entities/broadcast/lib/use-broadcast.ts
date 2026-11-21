import type { NormalizedEvent, ServerEvent } from '@/shared/types'
import type { BroadcastPayload } from '../types'
import { normalizeBroadcastEvent } from './normalize-broadcast-event'

type TUseBroadcast = () => {
  normalizeBroadcastEvent: (event: ServerEvent<BroadcastPayload>) => NormalizedEvent<BroadcastPayload>
}

export const useBroadcast: TUseBroadcast = () => ({
  normalizeBroadcastEvent
})
