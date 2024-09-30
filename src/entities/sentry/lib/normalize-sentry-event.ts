import moment from 'moment/moment';
import type { ServerEvent, NormalizedEvent } from '@/shared/types';
import { EventTypes } from '@/shared/types';
import type { Sentry } from '../types';

export const normalizeSentryEvent = (
  event: ServerEvent<Sentry>,
): NormalizedEvent<Sentry> => {
  const normalizedEvent: NormalizedEvent<Sentry> = {
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    id: event.uuid,
    labels: [EventTypes.Sentry, 'exception'],
    origin: {
      logger: event.payload.logger,
      environment: event.payload.environment,
      release: event.payload?.release || '-',
    },
    payload: event.payload,
    serverName: event.payload?.server_name || '',
    type: EventTypes.Sentry,
  };

  if (normalizedEvent.date) {
    normalizedEvent
      .labels
      .unshift(moment(normalizedEvent.date).format('HH:mm:ss'));
  }

  return normalizedEvent;
};
