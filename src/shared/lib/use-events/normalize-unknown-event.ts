import type { ServerEvent, NormalizedEvent } from '../../types'

export const normalizeUnknownEvent = (event: ServerEvent<unknown>): NormalizedEvent<unknown> => ({
  id: event.uuid,
  type: 'unknown',
  labels: [String(event.type)],
  origin: null,
  serverName: '',
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  payload: event.payload
})
