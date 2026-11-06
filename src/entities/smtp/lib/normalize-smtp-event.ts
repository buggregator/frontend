import { normalizeEvent } from "@/shared/lib/normalize-event";
import { EventTypes } from "@/shared/types";
import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import type { SMTP } from "../types";

export const normalizeSmtpEvent = (event: ServerEvent<SMTP>): NormalizedEvent<SMTP> =>
  normalizeEvent(event, { type: EventTypes.Smtp, labels: [EventTypes.Smtp] })
