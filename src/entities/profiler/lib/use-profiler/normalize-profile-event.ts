import { normalizeEvent } from "@/shared/lib/normalize-event";
import { type ServerEvent, type NormalizedEvent, EventTypes } from "@/shared/types";
import type { Profiler } from "../../types";

export const normalizeProfilerEvent = (event: ServerEvent<Profiler>): NormalizedEvent<Profiler> =>
  normalizeEvent(event, {
    type: EventTypes.Profiler,
    labels: [EventTypes.Profiler],
    origin: { name: event.payload.app_name, ...event.payload.tags },
    serverName: event.payload.hostname,
  })
