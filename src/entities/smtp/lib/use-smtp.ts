import type { ServerEvent, NormalizedEvent } from '~/src/shared/types';
import type { SMTP } from "../types";
import { normalizeSmtpEvent } from "./normalize-smtp-event";
import { type TUseSmtpApi, useSmtpApi } from "~/src/shared/lib/use-smtp";

type TUseSmtp = () => {
  normalizeSmtpEvent: (event: ServerEvent<SMTP>) => NormalizedEvent<SMTP>
  smtp: TUseSmtpApi
}

export const useSmtp: TUseSmtp = () => {
  return {
    normalizeSmtpEvent,
    smtp: useSmtpApi()
  }
}
