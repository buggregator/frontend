import moment from 'moment';
import { EventTypes } from '@/shared/types';
import type { ServerEvent, NormalizedEvent } from '@/shared/types';
import type { SMTP } from '../types';

export const normalizeSmtpEvent = (
  event: ServerEvent<SMTP>,
): NormalizedEvent<SMTP> => {
  const normalizedEvent: NormalizedEvent<SMTP> = {
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    id: event.uuid,
    labels: [EventTypes.Smtp],
    origin: null,
    payload: event.payload,
    serverName: '',
    type: EventTypes.Smtp,
  };

  if (normalizedEvent.date) {
    normalizedEvent
      .labels
      .unshift(
        moment(normalizedEvent.date).format('HH:mm:ss'),
      );
  }

  return normalizedEvent;
};
