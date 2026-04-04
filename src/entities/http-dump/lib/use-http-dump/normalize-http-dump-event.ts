import moment from "moment/moment";
import {type ServerEvent, type NormalizedEvent, type Attachment, EventTypes} from "@/shared/types";
import type {HttpDump, HttpDumpServer} from "../../types";

export const normalizeHttpDumpEvent = (event: ServerEvent<HttpDumpServer>): NormalizedEvent<HttpDump> => {
  const isProxy = !!event.payload.proxy;
  const host = event.payload.host;
  const uri = event.payload.request.uri;

  // Build full URL for proxy requests (host includes port)
  const fullUrl = isProxy
    ? `${host}${uri}`
    : uri;

  const normalizedEvent: NormalizedEvent<HttpDump> = {
    id: event.uuid,
    type: EventTypes.HttpDump,
    labels: [EventTypes.HttpDump],
    origin: {uri: fullUrl},
    serverName: host,
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

  if (isProxy) {
    normalizedEvent.labels.push({text: 'proxy', color: 'violet'});
  }

  if (event.payload.response?.status_code) {
    const code = event.payload.response.status_code;
    const color = code >= 500 ? 'red' : code >= 400 ? 'orange' : code >= 300 ? 'blue' : 'green';
    normalizedEvent.labels.push({text: String(code), color});
  }

  if (event.payload.duration_ms != null) {
    normalizedEvent.labels.push(`${event.payload.duration_ms}ms`);
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
