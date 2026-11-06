import type { ServerEvent, NormalizedEvent } from "../../types";
import { normalizeEvent } from "../normalize-event";

// An unknown type gets no time label: its only label is the raw type.
export const normalizeUnknownEvent = (event: ServerEvent<unknown>): NormalizedEvent<unknown> => ({
  ...normalizeEvent(event, { type: 'unknown', labels: [] }),
  labels: [String(event.type)],
})
