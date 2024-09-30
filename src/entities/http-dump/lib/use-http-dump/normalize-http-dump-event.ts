import moment from 'moment/moment';
import {
  type ServerEvent,
  type NormalizedEvent,
  type Attachment,
  EventTypes,
} from '@/shared/types';
import type { HttpDump, HttpDumpServer } from '../../types';

type NormalizeHttpDumpEvent = (
  event: ServerEvent<HttpDumpServer>
) => NormalizedEvent<HttpDump>;

export const normalizeHttpDumpEvent: NormalizeHttpDumpEvent = (event) => {
  const normalizedEvent: NormalizedEvent<HttpDump> = {
    date: event.timestamp
      ? new Date(event.timestamp * 1000)
      : null,
    id: event.uuid,
    labels: [EventTypes.HttpDump],
    origin: { uri: event.payload.request.uri },
    payload: {
      ...event.payload,
      request: {
        ...event.payload.request,
        files: (event?.payload?.request?.files || []).map(
          (file) =>
            ({
              mime: file.mime,
              name: file.name,
              path: file.uri || '',
              size: file.size,
              uuid: file.uuid,
            }) as Attachment,
        ),
      },
    },
    serverName: event.payload.host,
    type: EventTypes.HttpDump,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(
      moment(normalizedEvent.date).format('HH:mm:ss'),
    );
  }

  return normalizedEvent;
};
