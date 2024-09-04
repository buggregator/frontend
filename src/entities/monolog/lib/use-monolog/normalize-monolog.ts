import moment from "moment/moment";
import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import { EVENT_TYPES } from "@/shared/types";
import type { Monolog } from "../../types";

export const normalizeMonolog = (event: ServerEvent<Monolog>): NormalizedEvent<Monolog> => {
  const normalizedEvent: NormalizedEvent<Monolog> = {
    id: event.uuid,
    type: EVENT_TYPES.MONOLOG,
    labels: [EVENT_TYPES.MONOLOG, event.payload.channel],
    origin: event.payload?.context?.source || null,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
