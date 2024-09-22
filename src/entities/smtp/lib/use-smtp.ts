import type { ServerEvent, NormalizedEvent } from "@/shared/types";
import type { SMTP } from "../types";
import { normalizeSmtpEvent } from "./normalize-smtp-event";

type TUseSmtp = () => {
  normalizeSmtpEvent: (event: ServerEvent<SMTP>) => NormalizedEvent<SMTP>;
};

export const useSmtp: TUseSmtp = () => ({
  normalizeSmtpEvent
});
