import { useSmtpRequests } from "@/shared/lib/io";
import type { ServerEvent, NormalizedEvent, EventId, Attachment } from '@/shared/types';
import type { SMTP } from "../types";
import { normalizeSmtpEvent } from "./normalize-smtp-event";

type TUseSmtp = () => {
  normalizeSmtpEvent: (event: ServerEvent<SMTP>) => NormalizedEvent<SMTP>
  getAttachments: (id: EventId) => Promise<Attachment[]>
}

export const useSmtp: TUseSmtp = () => {
  const { getAttachments } = useSmtpRequests();

  return {
    normalizeSmtpEvent,
    getAttachments
  }
}
