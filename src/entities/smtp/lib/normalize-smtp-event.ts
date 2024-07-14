import moment from "moment";
import { EVENT_TYPES } from "~/src/shared/types";
import type {  ServerEvent, NormalizedEvent } from "~/src/shared/types";
import type { SMTP } from "../types";

export const normalizeSmtpEvent = (event: ServerEvent<SMTP>): NormalizedEvent<SMTP> => {
  const normalizedEvent: NormalizedEvent<SMTP> = {
    id: event.uuid,
    type: EVENT_TYPES.SMTP,
    labels: [EVENT_TYPES.SMTP],
    origin: null,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
