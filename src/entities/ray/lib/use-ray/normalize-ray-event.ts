import pick from "lodash/pick";
import { EVENT_TYPES, ServerEvent } from "~/src/shared/types";
import { EnhancedRayEvent, RayContentColor, RayContentLabel, RayContentSize, RayDump, RAY_EVENT_TYPES } from "../../types";

export const normalizeRayEvent = (event: ServerEvent<RayDump>): EnhancedRayEvent => {
  let origin = {
    php_version: event.payload.meta?.php_version,
    laravel_version: '',
    symfony_version: '',
  }

  if (event.payload.meta?.laravel_version) {
    origin.laravel_version = event.payload.meta?.laravel_version
  } else if (event.payload.meta?.symfony_version) {
    origin.symfony_version = event.payload.meta?.symfony_version
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
    .filter(payload => Object.values(RAY_EVENT_TYPES).includes(payload.type as RAY_EVENT_TYPES))
    .map(payload => payload.type)
    .filter(Boolean)

  const color = event.payload.payloads
    .filter(payload => payload.type === 'color')
    .map(payload => (payload.content as RayContentColor)?.color)
    .filter(Boolean)
    .shift() || 'black'

  const size = (event.payload.payloads
    .filter(payload => payload.type === 'size')
    .map(payload => (payload.content as RayContentSize)?.size)
    .filter(Boolean)
    .shift() || 'md') as EnhancedRayEvent['meta']['size']

  return {
    id: event.uuid,
    type: EVENT_TYPES.RAY_DUMP,
    labels: [EVENT_TYPES.RAY_DUMP, ...labels, ...typeLabels].filter((x, i, a) => a.indexOf(x) === i),
    origin,
    serverName: "",
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    payload: event.payload,
    meta: {
      color,
      size
    }
  }
}
