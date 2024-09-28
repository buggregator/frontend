import { storeToRefs } from 'pinia';
import { useProfileStore } from '../../stores';
import type { EventId, Attachment } from '../../types';
import { REST_API_URL } from './constants';

type TUseAttachments = () => {
  getAttachments: (id: EventId) => Promise<Attachment[]>;
  calcDownloadLink: (id: EventId, attachmentId: string) => string;
};

export const useAttachments: TUseAttachments = () => {
  const { token } = storeToRefs(useProfileStore());

  const headers = { 'X-Auth-Token': token.value };

  const calcDownloadLink = (id: EventId, attachmentId?: string): string =>
    `${REST_API_URL}/api/smtp/${id}/attachments${attachmentId ? `/${attachmentId}` : ''}`;

  const getAttachments = (id: EventId) =>
    fetch(calcDownloadLink(id), { headers })
      .then((response) => response.json())
      .then((response) => {
        if (response?.data) {
          return response.data;
        }

        if (response?.code === 403) {
          console.error('Forbidden');

          return [];
        }

        console.error('Fetch Error');

        return [];
      });

  return {
    getAttachments,
    calcDownloadLink,
  };
};
