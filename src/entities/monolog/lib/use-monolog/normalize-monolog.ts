import moment from "moment/moment";
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

  const normalizedEvent: NormalizedEvent<Monolog> = {
    id: event.uuid,
    type: EventTypes.Monolog,
    labels: [
      EventTypes.Monolog,
      { text: levelName, color: levelColor },
      event.payload.channel,
    ],
    origin: event.payload?.context?.source || null,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload
  }

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format("HH:mm:ss"));
  }

  return normalizedEvent;
}
