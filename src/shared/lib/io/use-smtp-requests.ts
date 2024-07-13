import {useProfileStore} from "../../stores/profile";
import type { EventId, Attachment } from "../../types";
import { REST_API_URL } from "./constants";

type TUseSmtpRequests = () => {
  getAttachments: (id: EventId) => Promise<Attachment[]>
}

// TODO: add 403 response handling

export const useSmtpRequests: TUseSmtpRequests = () => {
  const { token } = storeToRefs(useProfileStore())

  const headers = {"X-Auth-Token": token.value }

  const getAttachmentsRestUrl = (id: EventId): string => `${REST_API_URL}/api/smtp/${id}/attachments`

  const getAttachments = (id: EventId) => fetch(getAttachmentsRestUrl(id), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data
      }

      if (response?.code === 403) {
        console.error('Forbidden')
        return [];
      }

      console.error('Fetch Error')

      return [];
    })

  return {
    getAttachmentsRestUrl,
    getAttachments
  }
}
