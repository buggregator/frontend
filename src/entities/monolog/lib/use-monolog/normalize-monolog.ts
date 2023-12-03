import type { ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { EVENT_TYPES } from "~/src/shared/types";
import type { Monolog } from "../../types";

export const normalizeMonolog = (event: ServerEvent<Monolog>): NormalizedEvent<Monolog> => {
  const origin = event.payload?.context?.source || null;

  return {
    id: event.uuid,
    type: EVENT_TYPES.MONOLOG,
    labels: [EVENT_TYPES.MONOLOG],
    origin,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }
}
