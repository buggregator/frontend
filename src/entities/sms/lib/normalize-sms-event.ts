import { normalizeEvent } from "@/shared/lib/normalize-event";
import { EventTypes } from "@/shared/types";
import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import type { SmsPayload } from "../types";

export const normalizeSmsEvent = (event: ServerEvent<SmsPayload>): NormalizedEvent<SmsPayload> =>
  normalizeEvent(event, { type: EventTypes.Sms, labels: [EventTypes.Sms] })
