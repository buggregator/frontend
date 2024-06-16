import type { Attachment, Uuid } from '~/src/shared/types';

export interface SMTPUser {
  name: string,
  email: string,
}

export interface SMTP {
  id: string,
  from?: SMTPUser[],
  reply_to?: SMTPUser[],
  subject: string,
  to?: SMTPUser[],
  cc?: SMTPUser[],
  bcc?: SMTPUser[],
  text: string,
  html: string,
  raw: string,
}

export interface SMTPAttachment {
  uuid: Uuid,
  name: string,
  path: string,
  size: number,
  mime: string,
}
