import { storeToRefs } from "pinia";
import {useProfileStore} from "../../stores";
import type { EventId, Attachment } from "../../types";
import { REST_API_URL } from "./constants";

type EventModule = 'smtp' | 'http-dump'

type TUseAttachments = (module?: EventModule) => {
  getAttachments: (id: EventId) => Promise<Attachment[]>
  calcDownloadLink: (id: EventId, attachmentId: string) => string
}

export const useAttachments: TUseAttachments = (module: EventModule = 'smtp') => {
  const { token } = storeToRefs(useProfileStore())

  const headers = {"X-Auth-Token": token.value }

  // The server namespaces attachment endpoints under `/api/{module}/attachments/...`
  // (literal `attachments` segment first) to avoid colliding with module routes
  // like `/api/smtp/message/{uuid}/raw`. See server: internal/server/http/attachments.go.
  const calcDownloadLink = (id: EventId, attachmentId?: string): string =>
    `${REST_API_URL}/api/${module}/attachments/${id}${attachmentId ? `/${attachmentId}` : ''}`

  const getAttachments = (id: EventId) => fetch(calcDownloadLink(id), { headers })
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
    getAttachments,
    calcDownloadLink
  }
}
