import type {ServerEvent, NormalizedEvent, Attachment } from "~/src/shared/types";
import {EVENT_TYPES } from "~/src/shared/types";
import type {HttpDump, HttpDumpServer} from "../../types";

export const normalizeHttpDumpEvent = (event: ServerEvent<HttpDumpServer>): NormalizedEvent<HttpDump> => {
  const result = {
    id: event.uuid,
    type: EVENT_TYPES.HTTP_DUMP,
    labels: [EVENT_TYPES.HTTP_DUMP],
    origin: {uri: event.payload.request.uri},
    serverName: event.payload.host,
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  };

  if (event?.payload?.request?.files && event.payload.request.files.length > 0) {
    result.payload.request.files = (event.payload.request.files || []).map(file => ({
      uuid: file.uuid,
      name: file.name,
      size: file.size,
      mime: file.mime,
      path: file.uri || '',
    } as Attachment))
  }

  return (result as NormalizedEvent<HttpDump>);
}


