import { EventTypes, type PageEventTypes } from '@/shared/types'

// The event pages with tabs (EventTabs): their tabs go to row 2 of the page
// header (design #6737 A). The header has row 2 only for these.
const TABBED: string[] = [
  EventTypes.Sentry,
  EventTypes.Smtp,
  EventTypes.HttpDump,
  EventTypes.Profiler,
  EventTypes.XdebugTrace,
  EventTypes.Html
]

export const hasEventTabs = (type?: PageEventTypes | string) => !!type && TABBED.includes(type)
