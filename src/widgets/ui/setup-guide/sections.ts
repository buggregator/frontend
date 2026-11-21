// Sections with setup help, without loading the content file (it comes with
// the guide's own chunk). A test keeps this in step with setup-help.json.
export const SETUP_SECTION_IDS = [
  'sentry',
  'crons',
  'profiler',
  'inspector',
  'smtp',
  'monolog',
  'var-dump',
  'ray',
  'http-dump',
  'sms',
  'broadcast',
  'csp',
  'xdebug-trace',
  'mock-server',
  'xdebug',
  'http-proxy'
] as const

export const hasSetupHelp = (id: string) => (SETUP_SECTION_IDS as readonly string[]).includes(id)
