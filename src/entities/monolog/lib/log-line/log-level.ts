import { MonologLevel } from '../../types'

// The levels of a Monolog record, lowest first, as the server's `level` facet
// names them.
export const MONOLOG_LEVEL_KEYS = [
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency'
] as const

export type MonologLevelKey = (typeof MONOLOG_LEVEL_KEYS)[number]

const THRESHOLDS: [number, MonologLevelKey][] = [
  [MonologLevel.EMERGENCY, 'emergency'],
  [MonologLevel.ALERT, 'alert'],
  [MonologLevel.CRITICAL, 'critical'],
  [MonologLevel.ERROR, 'error'],
  [MonologLevel.WARNING, 'warning'],
  [MonologLevel.NOTICE, 'notice'],
  [MonologLevel.INFO, 'info']
]

// The level of a record by its number (a custom number counts as the level
// below it); by its name when the number is missing.
export const monologLevelKey = (level: number | null | undefined, name = ''): MonologLevelKey => {
  if (typeof level === 'number' && Number.isFinite(level)) {
    return THRESHOLDS.find(([min]) => level >= min)?.[1] ?? 'debug'
  }
  const key = name.toLowerCase()
  return (MONOLOG_LEVEL_KEYS as readonly string[]).includes(key)
    ? (key as MonologLevelKey)
    : 'debug'
}

export const monologLevelLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1)

// Error and worse: the red part of a chart, the red mark of a row.
export const isMonologErrorLevel = (key: string) =>
  key === 'error' || key === 'critical' || key === 'alert' || key === 'emergency'
