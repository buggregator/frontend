import type { ServerEvent } from '@/shared/types'
import type { Monolog } from '../types'

const createMonologMock = (
  level: number,
  levelName: string,
  message: string,
): ServerEvent<Monolog> => ({
  uuid: `monolog-${levelName.toLowerCase()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
  type: 'monolog',
  payload: {
    message,
    context: { foo: 'bar' },
    level,
    level_name: levelName,
    channel: 'application',
    datetime: '2024-06-27T15:59:34.201624+02:00',
    extra: [],
  },
  timestamp: 1719496774,
  project: null,
} as unknown as ServerEvent<Monolog>)

export const monologDebugMock = createMonologMock(
  100, 'DEBUG',
  'Loading configuration from /etc/app/config.yml'
)

export const monologInfoMock = createMonologMock(
  200, 'INFO',
  'User authentication successful for user_id=42'
)

export const monologNoticeMock = createMonologMock(
  250, 'NOTICE',
  'Cache miss for key "user_profile_42", fetching from database'
)

export const monologWarningMock = createMonologMock(
  300, 'WARNING',
  'Deprecated method "getUsers()" called in UserController. Use "listUsers()" instead.'
)

export const monologErrorMock = createMonologMock(
  400, 'ERROR',
  'Failed to connect to Redis at 127.0.0.1:6379 - Connection refused'
)

export const monologCriticalMock = createMonologMock(
  500, 'CRITICAL',
  'Database connection pool exhausted. All 50 connections are in use. Queries are being rejected.'
)

export const monologAlertMock = createMonologMock(
  550, 'ALERT',
  'Payment gateway is not responding. All transactions are failing. Immediate action required.'
)

export const monologEmergencyMock = createMonologMock(
  600, 'EMERGENCY',
  'System is unusable. Disk /dev/sda1 is full (100%). All write operations are failing.'
)
