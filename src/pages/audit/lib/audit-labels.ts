import type { AuditEntry } from './use-audit-log'

// Plain words for the actions the server names itself; other records carry
// the route («POST /api/mocks») and are shown as is.
const ACTIONS: Record<string, string> = {
  login: 'Signed in',
  login_denied: 'Sign-in refused',
  logout: 'Signed out',
  'settings.update': 'Changed settings',
  'events.clear': 'Cleared events',
  'event.delete': 'Deleted an event',
  'sentry.clear': 'Cleared Sentry data',
  'smtp.clear': 'Cleared emails',
}

export const auditActionLabel = (action: string): string => ACTIONS[action] ?? action

export const isAuditRoute = (action: string): boolean => !(action in ACTIONS)

// The server writes UTC with microseconds; shown in the person's time zone.
export const auditTime = (at: string): string => {
  const date = new Date(at)
  return Number.isNaN(date.getTime())
    ? at
    : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' })
}

export const isAuditFailure = (entry: Pick<AuditEntry, 'status'>): boolean => entry.status >= 400
