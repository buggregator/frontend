import type { XdebugConfig, XdebugMode } from '../types'

// What PHP and Buggregator need so a session reaches the proxy (task #5394):
// PHP talks to Buggregator, never to the IDE; Buggregator dials the IDE.
export type XdebugSetup = {
  phpPort: string
  idePort: string
  // php.ini when PHP runs on this machine.
  host: string
  // php.ini when PHP runs in a container next to Buggregator.
  docker: string
  // Environment of the Buggregator container: listen on the Docker network, dial the IDE on the host.
  dockerEnv: string
}

const portOf = (addr: string) => addr.split(':').pop() ?? ''

const ini = (clientHost: string, port: string) => [
  'xdebug.mode=debug',
  `xdebug.client_host=${clientHost}`,
  `xdebug.client_port=${port}`,
  'xdebug.discover_client_host=0',
  'xdebug.start_with_request=yes'
].join('\n')

// Standalone never calls the IDE, so the IDE address is left out there.
export const xdebugSetup = (config: Pick<XdebugConfig, 'addr' | 'ide_addr' | 'mode'>): XdebugSetup => {
  const phpPort = portOf(config.addr)
  const idePort = portOf(config.ide_addr)
  const env = [`XDEBUG_PROXY_ADDR=0.0.0.0:${phpPort}`]
  if (config.mode !== 'standalone') env.push(`XDEBUG_PROXY_IDE_ADDR=host.docker.internal:${idePort}`)
  return {
    phpPort,
    idePort,
    host: ini('127.0.0.1', phpPort),
    docker: ini('buggregator', phpPort),
    dockerEnv: env.join('\n')
  }
}

// The mode line of the empty page: who drives a session once one arrives.
// Servers before PR #392 have no mode and only relay to the IDE.
export const xdebugModeText = (mode: XdebugMode | undefined, idePort: string, saved: string) => {
  if (mode === 'standalone') return { mode: 'Standalone', text: `Buggregator pauses at ${saved} and you step here.` }
  if (mode === 'auto') {
    return { mode: 'Auto', text: `your IDE drives when it listens on port ${idePort}; otherwise Buggregator pauses at ${saved} and you step here.` }
  }
  return { mode: 'Proxy', text: `Buggregator passes each session to your IDE on port ${idePort}.` }
}
