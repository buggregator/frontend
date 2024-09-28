import type { Attachment, Uuid } from '@/shared/types';

export interface HttpDumpServer {
  received_at: string;
  host: string;
  request: {
    method: string;
    uri: string;
    headers: Record<string, string[]>;
    body: string;
    query: Record<string, unknown>;
    post: Record<string, unknown>;
    cookies: Record<string, string>;
    files?: {
      mime: string;
      name: string;
      size: number;
      uuid: Uuid;
      uri?: string;
    }[];
  };
}

export interface HttpDump extends HttpDumpServer {
  request: Omit<HttpDumpServer['request'], 'files'> & {
    files?: Attachment[];
  };
}
