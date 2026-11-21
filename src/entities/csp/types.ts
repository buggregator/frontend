// A browser's CSP violation or Reporting API report (#6604, buggregator/server #475).
// The server leaves empty fields out.
export type CspReport = {
  // csp-violation, deprecation, intervention, crash…
  type: string
  url?: string
  user_agent?: string
  directive?: string
  blocked?: string
  // enforce | report
  disposition?: string
  source_file?: string
  line?: number
  column?: number
  sample?: string
  policy?: string
  // Non-CSP reports (deprecation, intervention): what the browser said.
  message?: string
  id?: string
  // The report's own body as sent, for anything above leaves out.
  body?: unknown
}

export type CspPayload = {
  format: 'csp-report' | 'reports+json' | string
  reports: CspReport[]
}
