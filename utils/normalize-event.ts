import {
  NormalizedEvent,
  RayDump,
} from "~/config/types";
import { RAY_EVENT_TYPES } from "~/config/constants";
import { EVENT_TYPES, ServerEvent } from "~/src/shared/types";
import pick from 'lodash/pick';

export const normalizeRayDumpEvent = (event: ServerEvent<RayDump>): NormalizedEvent => {
  let origin = {
    php_version: event.payload.meta?.php_version,
    laravel_version: event.payload.meta?.laravel_version,
  }

  event.payload.payloads
    .forEach(payload => {
      if (payload.origin) {
        origin = {
          ...origin,
          ...pick(payload.origin, ['file', 'line_number', 'hostname']),
        }
      }
    })

  const labels = event.payload.payloads
    .filter(payload => payload.type === 'label')
    .map(payload => payload.content.label)

  const typeLabels = event.payload.payloads
    .filter(payload => Object.values(RAY_EVENT_TYPES).includes(payload.type))
    .map(payload => payload.type)

  event.payload.payloads
    .filter(payload => payload.type === 'size')

  const color = event.payload.payloads
    .filter(payload => payload.type === 'color')
    .map(payload => payload.content?.color).shift() || 'black'

  const size = event.payload.payloads
    .filter(payload => payload.type === 'size')
    .map(payload => payload.content?.size).shift() || 'md'

  return {
    id: event.uuid,
    type: EVENT_TYPES.RAY_DUMP,
    labels: [EVENT_TYPES.RAY_DUMP, ...labels, ...typeLabels].filter((x, i, a) => a.indexOf(x) === i),
    origin,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    color,
    size,
    payload: event
  }
}

