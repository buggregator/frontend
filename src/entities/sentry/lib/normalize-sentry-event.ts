import moment from "moment/moment";
import type { ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { EVENT_TYPES } from "~/src/shared/types";
import type { Sentry } from "../types";

export const normalizeSentryEvent = (event: ServerEvent<Sentry>): NormalizedEvent<Sentry> => {
  const normalizedEvent: NormalizedEvent<Sentry> = {
    id: event.uuid,
    type: EVENT_TYPES.SENTRY,
    labels: [EVENT_TYPES.SENTRY, 'exception'],
    origin: {
      logger: event.payload.logger,
      environment: event.payload.environment,
      release: event.payload?.release || '-',
    },
    serverName: event.payload?.server_name || '',
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload,
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
