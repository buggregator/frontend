import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { HttpDump } from "../types";

export const normalizeHttpDumpEvent = (event: ServerEvent<HttpDump>): NormalizedEvent<HttpDump> => ({
  id: event.uuid,
  type: EVENT_TYPES.HTTP_DUMP,
  labels: [EVENT_TYPES.HTTP_DUMP],
  origin: {uri: event.payload.request.uri},
  serverName: event.payload.host,
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  payload: event.payload
})


