import { normalizeEvent } from '@/shared/lib/normalize-event'
import { EventTypes, type NormalizedEvent, type ServerEvent } from '@/shared/types'
import type { HtmlPayload } from '../types'

export const normalizeHtmlEvent = (event: ServerEvent<HtmlPayload>): NormalizedEvent<HtmlPayload> =>
  normalizeEvent(event, { type: EventTypes.Html, labels: [EventTypes.Html] })
