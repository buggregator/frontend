import pick from "lodash/pick";
import { RAY_EVENT_TYPES } from "~/config/constants";
import { EVENT_TYPES, ServerEvent, NormalizedEvent } from "~/src/shared/types";
import { RayContentColor, RayContentLabel, RayContentSize, RayDump } from "../../types";

export const normalizeRayEvent = (event: ServerEvent<RayDump>): NormalizedEvent<RayDump> => {
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
    .map(payload => (payload?.content as RayContentLabel)?.label)
    .filter(Boolean)

  const typeLabels = event.payload.payloads
    .filter(payload => Object.values(RAY_EVENT_TYPES).includes(payload.type))
    .map(payload => payload.type)
    .filter(Boolean)

  const color = event.payload.payloads
    .filter(payload => payload.type === 'color')
    .map(payload => (payload.content as RayContentColor)?.color)
    .filter(Boolean)
    .shift() || 'black'

  const size = event.payload.payloads
    .filter(payload => payload.type === 'size')
    .map(payload => (payload.content as RayContentSize)?.size)
    .filter(Boolean)
    .shift()|| 'md'

  return {
    id: event.uuid,
    type: EVENT_TYPES.RAY_DUMP,
    labels: [EVENT_TYPES.RAY_DUMP, ...labels, ...typeLabels].filter((x, i, a) => a.indexOf(x) === i),
    origin,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    // color,
    // size,
    payload: event.payload
  }
}
