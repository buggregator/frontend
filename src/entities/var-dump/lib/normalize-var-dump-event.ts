import moment from "moment/moment";
import type { ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { EVENT_TYPES } from "~/src/shared/types";
import type { VarDump } from "../types";

export const normalizeVarDumpEvent = (event: ServerEvent<VarDump>): NormalizedEvent<VarDump> => {
  const normalizedEvent: NormalizedEvent<VarDump> = {
    id: event.uuid,
    type: EVENT_TYPES.VAR_DUMP,
    labels: [EVENT_TYPES.VAR_DUMP],
    origin: {
      file: event.payload.context?.source?.file || "",
      name: event.payload.context?.source?.name || "",
      line_number: event.payload.context?.source?.line || "",
    },
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  if (event.payload?.payload?.label) {
    normalizedEvent.labels.push(`label: ${event.payload.payload.label}`);
  }

  if (event.payload?.context?.cli) {
    normalizedEvent.labels.push({
      title: 'CLI',
      value: `${event.payload.context.cli.identifier}`,
      context: `${event.payload.context.cli.command_line}`
    });
  }

  return normalizedEvent;
}
