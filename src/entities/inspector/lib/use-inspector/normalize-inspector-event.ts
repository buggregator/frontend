import { normalizeEvent } from "@/shared/lib/normalize-event";
import { type ServerEvent, type NormalizedEvent, EventTypes } from "@/shared/types";
import type { Inspector, InspectorTransaction } from "../../types";

export const normalizeInspectorEvent = (event: ServerEvent<Inspector>): NormalizedEvent<Inspector> => {
  const transaction = event.payload[0] as InspectorTransaction;

  return normalizeEvent(event, {
    type: EventTypes.Inspector,
    labels: [EventTypes.Inspector],
    origin: { name: transaction.host.hostname, ip: transaction.host.ip, os: transaction.host.os },
    serverName: transaction.host.hostname,
  })
}
