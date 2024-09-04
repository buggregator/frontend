import moment from "moment/moment";
import type {ServerEvent, NormalizedEvent, Attachment } from "@/shared/types";
import {EVENT_TYPES } from "@/shared/types";
import type {HttpDump, HttpDumpServer} from "../../types";

export const normalizeHttpDumpEvent = (event: ServerEvent<HttpDumpServer>): NormalizedEvent<HttpDump> => {
  const normalizedEvent: NormalizedEvent<HttpDump> = {
    id: event.uuid,
    type: EVENT_TYPES.HTTP_DUMP,
    labels: [EVENT_TYPES.HTTP_DUMP],
    origin: {uri: event.payload.request.uri},
    serverName: event.payload.host,
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: {
      ...event.payload,
      request: {
        ...event.payload.request,
        files: (event?.payload?.request?.files || []).map(file => ({
          uuid: file.uuid,
          name: file.name,
          size: file.size,
          mime: file.mime,
          path: file.uri || '',
        } as Attachment))
      },
    }
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}


