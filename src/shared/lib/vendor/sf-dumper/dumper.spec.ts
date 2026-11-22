import { afterEach, describe, expect, it, vi } from 'vitest'
import { SfdumpWrap } from './dumper.js'

// Two children under the root: the dumper adds its context menu and search to such dumps.
const DUMP_HTML =
  '<pre class=sf-dump id=sf-dump-1 data-indent-pad="  "><span class=sf-dump-note>array:1</span> [' +
  '<samp data-depth=1 class=sf-dump-expanded>\n  "<span class=sf-dump-key>a</span>" => 1\n</samp>]\n</pre>'

const mountDump = () => {
  const host = document.createElement('div')
  host.innerHTML = DUMP_HTML
  document.body.appendChild(host)
  return host
}

const menus = () => document.querySelectorAll('.sf-dump-ctx-menu').length

describe('SfdumpWrap: a removed dump leaves nothing behind (frontend#242)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('removes its context menu from <body> on dispose', () => {
    const host = mountDump()
    const dispose = SfdumpWrap(document)('sf-dump-1')

    expect(menus()).toBe(1)

    dispose()
    host.remove()

    expect(menus()).toBe(0)
  })

  it('removes every listener it put on document and window on dispose', () => {
    const live = new Map<string, number>()
    const track = (target: EventTarget, name: string) => {
      const add = target.addEventListener.bind(target)
      const remove = target.removeEventListener.bind(target)
      vi.spyOn(target, 'addEventListener').mockImplementation((type, cb, opts) => {
        live.set(`${name}:${type}`, (live.get(`${name}:${type}`) ?? 0) + 1)
        add(type, cb, opts)
      })
      vi.spyOn(target, 'removeEventListener').mockImplementation((type, cb, opts) => {
        live.set(`${name}:${type}`, (live.get(`${name}:${type}`) ?? 0) - 1)
        remove(type, cb, opts)
      })
    }
    const host = mountDump()
    const render = SfdumpWrap(document)
    track(document, 'document')
    track(window, 'window')

    const dispose = render('sf-dump-1')
    expect([...live.values()].some((n) => n > 0)).toBe(true)

    dispose()
    host.remove()

    expect([...live.entries()].filter(([, n]) => n !== 0)).toEqual([])
  })

  it('dispose is safe to call twice and for a missing root', () => {
    mountDump()
    const render = SfdumpWrap(document)
    const dispose = render('sf-dump-1')

    dispose()
    expect(() => dispose()).not.toThrow()
    expect(() => render('sf-dump-missing')()).not.toThrow()
  })
})
