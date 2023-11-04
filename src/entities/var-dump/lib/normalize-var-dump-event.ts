import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { VarDump } from "../types";

export const normalizeVarDumpEvent = (event: ServerEvent<VarDump>): NormalizedEvent<VarDump> => ({
  id: event.uuid,
  type: EVENT_TYPES.VAR_DUMP,
  labels: [EVENT_TYPES.VAR_DUMP],
  origin: {
    file: event.payload.context.source.file,
    name: event.payload.context.source.name,
    line_number: event.payload.context.source.line,
  },
  serverName: "",
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  payload: event.payload
})