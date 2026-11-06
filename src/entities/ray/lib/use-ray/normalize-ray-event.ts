import { pick } from "@/shared/lib/helpers";
import { normalizeEvent } from "@/shared/lib/normalize-event";
import {EventTypes, type NormalizedEvent, type ServerEvent} from "@/shared/types";
import type {RayContentColor, RayContentLabel, RayContentSize, RayDump, RayDumpMeta} from "../../types";
import { RayEventTypes } from "../../types";

export const normalizeRayEvent = (event: ServerEvent<RayDump>): NormalizedEvent<RayDump, RayDumpMeta> => {
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

  (event?.payload?.payloads || [])
    .forEach(payload => {
      if (payload.origin) {
        origin = {
          ...origin,
          ...pick(payload.origin, ['file', 'line_number', 'hostname']),
        }
      }
    })

  const labels = (event?.payload?.payloads || [])
    .filter(payload => payload.type === 'label')
    .map(payload => (payload?.content as RayContentLabel)?.label)
    .filter(Boolean)

  const typeLabels = (event?.payload?.payloads || [])
    .filter(payload => Object.values(RayEventTypes).includes(payload.type as RayEventTypes))
    .map(payload => payload.type)
    .filter(Boolean)

  const color = (event?.payload?.payloads || [])
    .filter(payload => payload.type === 'color')
    .map(payload => (payload.content as RayContentColor)?.color)
    .filter(Boolean)
    .shift() || 'black' as RayDumpMeta['color']

  const size = ((event?.payload?.payloads || [])
    .filter(payload => payload.type === 'size')
    .map(payload => (payload.content as RayContentSize)?.size)
    .filter(Boolean)
    .shift() || 'md') as RayDumpMeta['size']

  return normalizeEvent<RayDump, RayDumpMeta>(event, {
    type: EventTypes.RayDump,
    labels: [EventTypes.RayDump, ...labels, ...typeLabels].filter((x, i, a) => a.indexOf(x) === i),
    origin,
    meta: {
      color,
      size
    }
  })
}
