import type { Monolog } from '@/entities/monolog'
import type { ServerEvent } from '@/shared/types'

// A Monolog line for the Logs page specs.
export const logLine = (
  uuid: string,
  payload: Partial<Monolog> = {},
  over: Partial<ServerEvent<Monolog>> = {}
) =>
  ({
    uuid,
    type: 'monolog',
    project: 'default',
    timestamp: 1795338814,
    payload: {
      message: `line ${uuid}`,
      context: {},
      extra: [],
      level: 200,
      level_name: 'INFO',
      channel: 'app',
      datetime: '2026-11-22T13:00:00+00:00',
      ...payload
    },
    ...over
  }) as ServerEvent<Monolog>
