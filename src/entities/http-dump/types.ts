
export interface HttpDumpFile {
  originalName?: string,
  mime: string,
  size: number,
  id: string;
  name?: string;
  uri?: string
}

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
    files: HttpDumpFile[]
  }
}
