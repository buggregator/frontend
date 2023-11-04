import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { Monolog } from "../types";

export const normalizeMonolog = (event: ServerEvent<Monolog>): NormalizedEvent<Monolog> => {
  const origin = event.payload.context?.source || null;

  return {
    id: event.uuid,
    type: EVENT_TYPES.VAR_DUMP,
    labels: [EVENT_TYPES.VAR_DUMP],
    origin,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }
}
