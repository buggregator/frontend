type SMTPUser = {
  name: string;
  email: string;
}

type SMTPAttachment = {
  id: string,
  name: string,
  size: number,
  mime: string,
  uri: string
}

export interface SMTP {
  id: string,
  from: SMTPUser[],
  reply_to: SMTPUser[],
  subject: string,
  to: SMTPUser[],
  cc: SMTPUser[],
  bcc: SMTPUser[],
  text: string,
  html: string,
  raw: string,
  attachments?: Record<string, SMTPAttachment> | SMTPAttachment[]
}
