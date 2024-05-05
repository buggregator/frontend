import type { Attachment, EventId } from '../../types';
import { useSmtpRequests } from "../io";

export type TUseSmtpApi = {
  getAttachments: (id: EventId) => Promise<Attachment[]>
}

export const useSmtpApi: TUseSmtpApi = () => {
  const {
    getAttachments
  } = useSmtpRequests()

  return {
    getAttachments
  }
}
