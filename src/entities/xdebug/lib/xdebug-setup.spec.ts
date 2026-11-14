import { describe, expect, it } from 'vitest'
import { xdebugModeText, xdebugSetup } from './xdebug-setup'

describe('xdebugSetup', () => {
  const setup = xdebugSetup({ addr: '127.0.0.1:9003', ide_addr: '127.0.0.1:9004' })

  it('points PHP on this machine at Buggregator, not at the IDE', () => {
    expect(setup.phpPort).toBe('9003')
    expect(setup.idePort).toBe('9004')
    expect(setup.host).toContain('xdebug.client_host=127.0.0.1')
    expect(setup.host).toContain('xdebug.client_port=9003')
    expect(setup.host).toContain('xdebug.discover_client_host=0')
    expect(setup.host).not.toContain('9004')
  })

  it('points PHP in a container at the Buggregator service name', () => {
    expect(setup.docker).toContain('xdebug.client_host=buggregator')
    expect(setup.docker).toContain('xdebug.client_port=9003')
    expect(setup.docker).toContain('xdebug.discover_client_host=0')
    expect(setup.docker).not.toContain('127.0.0.1')
  })

  it('opens the proxy to the Docker network and dials the IDE on the host', () => {
    expect(setup.dockerEnv).toBe('XDEBUG_PROXY_ADDR=0.0.0.0:9003\nXDEBUG_PROXY_IDE_ADDR=host.docker.internal:9004')
  })

  it('follows the configured ports', () => {
    const custom = xdebugSetup({ addr: '0.0.0.0:9010', ide_addr: 'host.docker.internal:9003' })
    expect(custom.host).toContain('xdebug.client_port=9010')
    expect(custom.docker).toContain('xdebug.client_port=9010')
    expect(custom.dockerEnv).toBe('XDEBUG_PROXY_ADDR=0.0.0.0:9010\nXDEBUG_PROXY_IDE_ADDR=host.docker.internal:9003')
  })

  it('leaves the IDE address out in standalone mode', () => {
    const alone = xdebugSetup({ addr: '127.0.0.1:9003', ide_addr: '127.0.0.1:9004', mode: 'standalone' })
    expect(alone.dockerEnv).toBe('XDEBUG_PROXY_ADDR=0.0.0.0:9003')
  })
})

describe('xdebugModeText', () => {
  it('says who drives without sounding like a failure', () => {
    const auto = xdebugModeText('auto', '9004', 'your breakpoints')
    expect(auto).toEqual({ mode: 'Auto', text: 'your IDE drives when it listens on port 9004; otherwise Buggregator pauses at your breakpoints and you step here.' })
    expect(auto.text).not.toMatch(/no IDE/i)
  })

  it('describes standalone and proxy, and treats an older server as proxy', () => {
    expect(xdebugModeText('standalone', '9004', 'your 2 saved breakpoints').text)
      .toBe('Buggregator pauses at your 2 saved breakpoints and you step here.')
    expect(xdebugModeText('proxy', '9004', '')).toEqual({ mode: 'Proxy', text: 'Buggregator passes each session to your IDE on port 9004.' })
    expect(xdebugModeText(undefined, '9004', '').mode).toBe('Proxy')
  })
})
