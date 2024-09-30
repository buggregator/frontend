import type { ServerEvent, NormalizedEvent } from '../../types';

export const normalizeUnknownEvent = (
  event: ServerEvent<unknown>,
): NormalizedEvent<unknown> => ({
  date: event.timestamp ? new Date(event.timestamp * 1000) : null,
  id: event.uuid,
  labels: [String(event.type)],
  origin: null,
  payload: event.payload,
  serverName: '',
  type: 'unknown',
});
