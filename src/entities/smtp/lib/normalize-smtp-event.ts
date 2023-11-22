import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { SMTP } from "../types";

export const normalizeSmtpEvent = (event: ServerEvent<SMTP>): NormalizedEvent<SMTP> => ({
  id: event.uuid,
  type: EVENT_TYPES.SMTP,
  labels: [EVENT_TYPES.SMTP],
  origin: null,
  serverName: "",
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  payload: event.payload
})
