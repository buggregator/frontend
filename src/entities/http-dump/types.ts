import type {Attachment, Uuid} from "@/shared/types";

export interface HttpDumpResponse {
  status_code: number,
  headers: Record<string, string[]>,
  body: string,
}

export interface HttpDumpServer {
  received_at: string,
  host: string,
  proxy?: boolean,
  duration_ms?: number,
  error?: string,
  response?: HttpDumpResponse,
  request: {
    method: string,
    uri: string,
    headers: Record<string, string[]>,
    body: string,
    query: Record<string, unknown>,
    post: Record<string, unknown>,
    cookies: {
      [key: string]: string
    },
    files?: {
      mime: string
      name: string
      size: number
      uuid: Uuid
      uri?: string
    }[]
  }
}

export interface HttpDump extends HttpDumpServer {
  request: Omit<HttpDumpServer['request'], 'files'> & {
    files?: Attachment[]
  }
}
