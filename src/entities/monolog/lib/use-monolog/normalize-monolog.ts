import moment from 'moment/moment';
import {
  type ServerEvent, type NormalizedEvent, EventTypes,
} from '@/shared/types';
import type { Monolog } from '../../types';

export const normalizeMonolog = (
  event: ServerEvent<Monolog>,
): NormalizedEvent<Monolog> => {
  const normalizedEvent: NormalizedEvent<Monolog> = {
    date: event.timestamp
      ? new Date(event.timestamp * 1000)
      : null,
    id: event.uuid,
    labels: [EventTypes.Monolog, event.payload.channel],
    origin: event.payload?.context?.source || null,
    payload: event.payload,
    serverName: '',
    type: EventTypes.Monolog,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(
      moment(normalizedEvent.date).format('HH:mm:ss'),
    );
  }

  return normalizedEvent;
};
