import moment from "moment/moment";
import type { ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { EVENT_TYPES } from "~/src/shared/types";
import type { Profiler } from "../../types";

export const normalizeProfilerEvent = (event: ServerEvent<Profiler>): NormalizedEvent<Profiler> => {
  const normalizedEvent: NormalizedEvent<Profiler> = {
    id: event.uuid,
      type: EVENT_TYPES.PROFILER,
    labels: [EVENT_TYPES.PROFILER],
    origin: {name: event.payload.app_name, ...event.payload.tags},
    serverName: event.payload.hostname,
      date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }


  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
