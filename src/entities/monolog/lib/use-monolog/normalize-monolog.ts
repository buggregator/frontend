import { normalizeEvent } from "@/shared/lib/normalize-event";
import {type ServerEvent, type NormalizedEvent, type LabelColor, EventTypes} from "@/shared/types";
import type { Monolog } from "../../types";

const levelColorMap: Record<string, LabelColor> = {
  DEBUG: 'gray',
  INFO: 'blue',
  NOTICE: 'cyan',
  WARNING: 'amber',
  ERROR: 'red',
  CRITICAL: 'red',
  ALERT: 'orange',
  EMERGENCY: 'red',
}

export const normalizeMonolog = (event: ServerEvent<Monolog>): NormalizedEvent<Monolog> => {
  const levelName = event.payload.level_name || 'DEBUG'
  const levelColor = levelColorMap[levelName] || 'gray'

  return normalizeEvent(event, {
    type: EventTypes.Monolog,
    labels: [
      EventTypes.Monolog,
      { text: levelName, color: levelColor },
      event.payload.channel,
    ],
    origin: event.payload?.context?.source || null,
  })
}
