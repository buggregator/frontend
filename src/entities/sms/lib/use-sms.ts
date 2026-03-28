import type { ServerEvent, NormalizedEvent } from '@/shared/types';
import type { SmsPayload } from "../types";
import { normalizeSmsEvent } from "./normalize-sms-event";

type TUseSms = () => {
  normalizeSmsEvent: (event: ServerEvent<SmsPayload>) => NormalizedEvent<SmsPayload>
}

export const useSms: TUseSms = () => ({
  normalizeSmsEvent
})
