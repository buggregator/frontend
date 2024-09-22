import moment from 'moment'
import { EventTypes } from '@/shared/types'
import type { ServerEvent, NormalizedEvent } from '@/shared/types'
import type { SMTP } from '../types'

export const normalizeSmtpEvent = (event: ServerEvent<SMTP>): NormalizedEvent<SMTP> => {
  const normalizedEvent: NormalizedEvent<SMTP> = {
    id: event.uuid,
    type: EventTypes.Smtp,
    labels: [EventTypes.Smtp],
    origin: null,
    serverName: '',
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format('HH:mm:ss'))
  }

  return normalizedEvent
}
