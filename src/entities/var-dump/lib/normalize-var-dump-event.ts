import moment from 'moment/moment';
import {
  type ServerEvent, type NormalizedEvent, EventTypes,
} from '@/shared/types';
import type { VarDump } from '../types';

export const normalizeVarDumpEvent = (
  event: ServerEvent<VarDump>,
): NormalizedEvent<VarDump> => {
  const normalizedEvent: NormalizedEvent<VarDump> = {
    date: event.timestamp ? new Date(event.timestamp * 1000) : null,
    id: event.uuid,
    labels: [EventTypes.VarDump],
    origin: {
      file: event.payload.context?.source?.file || '',
      name: event.payload.context?.source?.name || '',
      line_number: event.payload.context?.source?.line || '',
    },
    payload: event.payload,
    serverName: '',
    type: EventTypes.VarDump,
  };

  if (normalizedEvent.date) {
    normalizedEvent.labels.unshift(moment(normalizedEvent.date).format('HH:mm:ss'));
  }

  if (event.payload?.payload?.label) {
    normalizedEvent.labels.push(`label: ${event.payload.payload.label}`);
  }

  if (event.payload?.context?.cli) {
    normalizedEvent.labels.push({
      title: 'CLI',
      value: `${event.payload.context.cli.identifier}`,
      context: `${event.payload.context.cli.command_line}`,
    });
  }

  return normalizedEvent;
};
