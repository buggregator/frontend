import moment from 'moment/moment';
import {
  type ServerEvent, type NormalizedEvent, EventTypes,
} from '@/shared/types';
import type { Profiler } from '../../types';

export const normalizeProfilerEvent = (
  event: ServerEvent<Profiler>,
): NormalizedEvent<Profiler> => {
  const normalizedEvent: NormalizedEvent<Profiler> = {
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    id: event.uuid,
    labels: [EventTypes.Profiler],
    origin: {
      name: event.payload.app_name,
      ...event.payload.tags,
    },
    payload: event.payload,
    serverName: event.payload.hostname,
    type: EventTypes.Profiler,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(
      moment(normalizedEvent.date).format('HH:mm:ss'),
    );
  }

  return normalizedEvent;
};
