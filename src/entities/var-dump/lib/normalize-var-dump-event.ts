import { normalizeEvent } from "@/shared/lib/normalize-event";
import { type ServerEvent, type NormalizedEvent, EventTypes } from "@/shared/types";
import type { VarDump } from "../types";

export const normalizeVarDumpEvent = (event: ServerEvent<VarDump>): NormalizedEvent<VarDump> => {
  const normalizedEvent = normalizeEvent(event, { type: EventTypes.VarDump, labels: [EventTypes.VarDump] })

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
