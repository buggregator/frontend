import { describe, expect, it } from 'vitest'
import { fillSegments, fillText, pageHttpPort, projectJs, resolveValues, usedPorts } from './fill'

const defaults = { http_port: 8000, smtp_port: 1025, vardumper_port: 9912, monolog_port: 9913, proxy_port: 8080, xdebug_port: 9003 }

describe('setup help values', () => {
  it('fills only the known placeholders and leaves other braces alone', () => {
    const values = { host: 'localhost', http_port: '8000', project: 'shop' }
    const code = "\\Sentry\\init(['dsn' => 'http://sentry@{host}:{http_port}/{project}', 'x' => {foo}]);"

    expect(fillText(code, values)).toBe("\\Sentry\\init(['dsn' => 'http://sentry@localhost:8000/shop', 'x' => {foo}]);")
    expect(fillSegments('a {host} b {nope}', values)).toEqual([
      { text: 'a ', fill: false },
      { text: 'localhost', fill: true },
      { text: ' b {nope}', fill: false },
    ])
  })

  it('takes ports from the server, falls back to the defaults and says which', () => {
    const { values, defaulted } = resolveValues({
      host: 'h', projectKey: 'iris-app', ports: { http: 8001, var_dumper: 19912 }, defaults,
    })

    expect(values.http_port).toBe('8001')
    expect(values.vardumper_port).toBe('19912')
    expect(values.smtp_port).toBe('1025')
    expect(values.project).toBe('iris-app')
    expect(values.project_js).toBe('iris_app')
    expect(defaulted.has('smtp_port')).toBe(true)
    expect(defaulted.has('http_port')).toBe(false)
  })

  it('an old server without ports: every port is a default', () => {
    const { defaulted } = resolveValues({ host: 'h', projectKey: '', ports: null, defaults })
    expect(defaulted.size).toBe(6)
  })

  it('no project gives «default»', () => {
    expect(resolveValues({ host: 'h', projectKey: '', ports: null, defaults }).values.project).toBe('default')
  })

  it('lists the ports a text uses', () => {
    expect(usedPorts('smtp://{project}:any@{host}:{smtp_port} {http_port}')).toEqual(['smtp_port', 'http_port'])
  })

  it('project key for the JS SDK: every - becomes _', () => {
    expect(projectJs('a-b-c')).toBe('a_b_c')
  })
  it('ports present but one missing: that listener is off, not «could not read»', () => {
    const { values, defaulted, off } = resolveValues({ host: 'h', projectKey: '', ports: { http: 8000, smtp: 1025 }, defaults })
    expect(values.xdebug_port).toBe('9003')
    expect(defaulted.has('xdebug_port')).toBe(true)
    expect(off.has('xdebug_port')).toBe(true)
    expect(off.has('smtp_port')).toBe(false)
  })

  it('no ports at all: nothing is «off», all are unknown', () => {
    expect(resolveValues({ host: 'h', projectKey: '', ports: null, defaults }).off.size).toBe(0)
  })

  it('HTTP port from the page address: explicit port, else the scheme port', () => {
    expect(pageHttpPort({ protocol: 'http:', port: '9000' })).toEqual({ port: '9000', https: false })
    expect(pageHttpPort({ protocol: 'http:', port: '' })).toEqual({ port: '80', https: false })
    expect(pageHttpPort({ protocol: 'https:', port: '' })).toEqual({ port: '443', https: true })
    expect(pageHttpPort({ protocol: 'https:', port: '8443' })).toEqual({ port: '8443', https: true })
    expect(pageHttpPort({ protocol: 'file:', port: '' })).toBeNull()
  })
})
