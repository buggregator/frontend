import pick from 'lodash/pick';
import moment from 'moment';
import {
  EventTypes, type NormalizedEvent, type ServerEvent,
} from '@/shared/types';
import type {
  RayContentColor,
  RayContentLabel,
  RayContentSize,
  RayDump,
  RayDumpMeta,
} from '../../types';
import { RayEventTypes } from '../../types';

export const normalizeRayEvent = (
  event: ServerEvent<RayDump>,
): NormalizedEvent<RayDump> => {
  let origin = {
    php_version: event.payload.meta?.php_version,
    laravel_version: '',
    symfony_version: '',
  };

  if (event.payload.meta?.laravel_version) {
    origin.laravel_version = event.payload.meta?.laravel_version;
  } else if (event.payload.meta?.symfony_version) {
    origin.symfony_version = event.payload.meta?.symfony_version;
  }

  (event?.payload?.payloads || []).forEach((payload) => {
    if (payload.origin) {
      origin = {
        ...origin,
        ...pick(
          payload.origin,
          [
            'file',
            'line_number',
            'hostname',
          ],
        ),
      };
    }
  });

  const labels = (event?.payload?.payloads || [])
    .filter((payload) => payload.type === 'label')
    .map((payload) => (payload?.content as RayContentLabel)?.label)
    .filter(Boolean);

  const typeLabels = (event?.payload?.payloads || [])
    .filter(
      (payload) =>
        Object
          .values(RayEventTypes)
          .includes(payload.type as RayEventTypes),
    )
    .map((payload) => payload.type)
    .filter(Boolean);

  const color = (event?.payload?.payloads || [])
    .filter((payload) => payload.type === 'color')
    .map((payload) => (payload.content as RayContentColor)?.color)
    .filter(Boolean)
    .shift() || ('black' as RayDumpMeta['color']);

  const size = ((event?.payload?.payloads || [])
    .filter((payload) => payload.type === 'size')
    .map((payload) => (payload.content as RayContentSize)?.size)
    .filter(Boolean)
    .shift() || 'md') as RayDumpMeta['size'];

  const normalizedEvent: NormalizedEvent<RayDump> = {
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    id: event.uuid,
    labels: [
      EventTypes.RayDump,
      ...labels,
      ...typeLabels,
    ].filter((x, i, a) => a.indexOf(x) === i),
    meta: {
      color,
      size,
    },
    origin,
    payload: event.payload,
    serverName: '',
    type: EventTypes.RayDump,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format('HH:mm:ss'));
  }

  return normalizedEvent;
};
