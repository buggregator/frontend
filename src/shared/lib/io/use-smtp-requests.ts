import { type NuxtApp, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import type { SMTPAttachment } from "~/src/entities/smtp/types";
import type { EventId, Attachment } from "../../types";
import { REST_API_URL } from "./constants";

type TUseSmtpRequests = () => {
  getAttachments: (id: EventId) => Promise<Attachment[]>
}

// TODO: add 403 response handling

export const useSmtpRequests: TUseSmtpRequests = () => {
  const app: NuxtApp = useNuxtApp()
  const { token } = app.$authToken ?? { token: null }
  const headers = { "X-Auth-Token": token || '' }

  const getAttachmentsRestUrl = (id: EventId): string => `${REST_API_URL}/api/smtp/${id}/attachments`

  const getAttachments = (id: EventId) => fetch(getAttachmentsRestUrl(id), { headers })
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return (response.data as SMTPAttachment[]).map((attachment) => ({
          id: attachment.uuid,
          name: attachment.name,
          size: attachment.size,
          mime: attachment.mime,
          uri: attachment.path
        }))
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
