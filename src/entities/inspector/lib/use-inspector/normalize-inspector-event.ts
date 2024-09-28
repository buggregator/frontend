import moment from 'moment';
import { type ServerEvent, type NormalizedEvent, EventTypes } from '@/shared/types';
import type { Inspector, InspectorTransaction } from '../../types';

type NormalizeInspectorEvent = (event: ServerEvent<Inspector>) => NormalizedEvent<Inspector>;

export const normalizeInspectorEvent: NormalizeInspectorEvent = (event) => {
  const transaction = event.payload[0] as InspectorTransaction;

  const normalizedEvent: NormalizedEvent<Inspector> = {
    id: event.uuid,
    type: EventTypes.Inspector,
    labels: [EventTypes.Inspector],
    origin: {
      name: transaction.host.hostname,
      ip: transaction.host.ip,
      os: transaction.host.os,
    },
    serverName: transaction.host.hostname,
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format('HH:mm:ss'));
  }

  return normalizedEvent;
};
