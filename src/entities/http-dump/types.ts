import type { Attachment } from "~/src/shared/types";

export interface HttpDump {
  received_at: string,
  host: string,
  request: {
    method: string,
    uri: string,
    headers: {
      [key: string]: string[]
    },
    body: string,
    query: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    post: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    cookies: {
      [key: string]: string
    },
    files: Attachment[]
  }
}
