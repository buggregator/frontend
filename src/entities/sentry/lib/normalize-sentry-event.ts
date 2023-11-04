import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { Sentry } from "../types";

export const normalizeSentryEvent = (event: ServerEvent<Sentry>): NormalizedEvent<Sentry> => ({
  id: event.uuid,
  type: EVENT_TYPES.SENTRY,
  labels: [EVENT_TYPES.SENTRY, 'exception'],
  origin: {
    logger: event.payload.logger,
    environment: event.payload.environment
  },
  serverName: event.payload.server_name,
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  payload: event.payload
})
