import { EVENT_TYPES } from "~/config/constants";
import { NormalizedEvent, Profiler, ServerEvent } from "~/config/types";
// TODO: need to move types to FSD structure

export const normalizeProfilerEvent = (event: ServerEvent<Profiler>): NormalizedEvent => ({
  id: event.uuid,
  type: EVENT_TYPES.PROFILER,
  labels: [EVENT_TYPES.PROFILER],
  origin: {name: event.payload.app_name, ...event.payload.tags},
  serverName: event.payload.hostname,
  date: new Date((event.timestamp || 0) * 1000),
  payload: event.payload
})
