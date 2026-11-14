import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import XdebugSetupGuide from './xdebug-setup-guide.vue'

const config = (over = {}) => ({ enabled: true, addr: '127.0.0.1:9003', ide_addr: '127.0.0.1:9004', allow_eval: false, mode: 'auto' as const, ...over })

describe('XdebugSetupGuide', () => {
  it('shows the host and the Docker setup side by side', () => {
    const w = mount(XdebugSetupGuide, { props: { config: config() } })
    const sections = w.findAll('section')
    expect(sections).toHaveLength(2)
    expect(sections[0].get('h3').text()).toBe('PHP on this machine')
    expect(sections[0].get('pre').text()).toContain('xdebug.client_host=127.0.0.1')
    expect(sections[1].get('h3').text()).toBe('PHP in Docker')
    expect(sections[1].text()).toContain('xdebug.client_host=buggregator')
    expect(sections[1].text()).toContain('XDEBUG_PROXY_ADDR=0.0.0.0:9003')
    expect(sections[1].text()).toContain('XDEBUG_PROXY_IDE_ADDR=host.docker.internal:9004')
  })

  it('tells PHP to talk to Buggregator and the IDE to listen on its own port', () => {
    const text = mount(XdebugSetupGuide, { props: { config: config() } }).text()
    expect(text).toContain('Point Xdebug at Buggregator on port 9003, not at your IDE')
    expect(text).toContain('port 9004')
    expect(text).toContain('XDEBUG_TRIGGER')
  })

  it('leaves the IDE out in standalone mode', () => {
    const w = mount(XdebugSetupGuide, { props: { config: config({ mode: 'standalone' }) } })
    expect(w.text()).not.toContain('IDE listens')
    expect(w.text()).not.toContain('XDEBUG_PROXY_IDE_ADDR')
    expect(w.text()).toContain('XDEBUG_PROXY_ADDR=0.0.0.0:9003')
  })
})
