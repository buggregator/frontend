import moment from "moment";
import { EventTypes } from "@/shared/types";
import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import type { SmsPayload } from "../types";

export const normalizeSmsEvent = (event: ServerEvent<SmsPayload>): NormalizedEvent<SmsPayload> => {
  const normalizedEvent: NormalizedEvent<SmsPayload> = {
    id: event.uuid,
    type: EventTypes.Sms,
    labels: [EventTypes.Sms],
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
