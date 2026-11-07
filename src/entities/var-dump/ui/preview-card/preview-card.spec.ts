import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDE_KEYS } from '@/shared/constants'
import { useSettingsStore } from '@/shared/stores'
import type { ServerEvent } from '@/shared/types'
import { normalizeVarDumpEvent } from '../../lib/normalize-var-dump-event'
import varDumpStringMock from '../../mocks/var-dump-string.json'
import type { VarDump } from '../../types'
import PreviewCard from './preview-card.vue'

const FILE = '/root/repos/spiral-apps/filters-bridge/app/src/Controller/HomeController.php'

const mountCard = (fileLink?: string) => {
  const event = structuredClone(varDumpStringMock) as unknown as ServerEvent<VarDump>
  if (fileLink !== undefined) event.payload.context.source.file_link = fileLink

  return mount(PreviewCard, {
    props: { event: normalizeVarDumpEvent(event) },
    global: { stubs: { PreviewCard: { template: '<div><slot /></div>' } } },
  })
}

// GitHub server#255: Symfony's file_link_format already maps the container
// path to the local one; the card uses that link as is.
describe('VarDumper list card: source link', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('opens the link the SDK sent and still shows file:line', () => {
    const link = mountCard('phpstorm://open?file=/home/me/app/src/Controller/HomeController.php&line=48').get('a.vd-body__source')

    expect(link.attributes('href')).toBe('phpstorm://open?file=/home/me/app/src/Controller/HomeController.php&line=48')
    expect(link.text()).toBe(`${FILE}:48`)
  })

  it('uses the IDE chosen in Settings over the SDK link', () => {
    useSettingsStore().changeActiveCodeEditor(IDE_KEYS.SUBLIME_TEXT)
    const href = mountCard('phpstorm://open?file=/home/me/app/src/Controller/HomeController.php&line=48')
      .get('a.vd-body__source').attributes('href')

    expect(href).toBe(`subl://open?url=${encodeURIComponent(`file://${FILE}`)}&line=48`)
  })

  it('uses the path mapping turned on in Settings over the SDK link', () => {
    const settings = useSettingsStore()
    settings.setCustomFilePathMapping([{ source_path: '/root/repos/', target_path: '/home/me/repos/' }])
    settings.changeIsActiveFilePathMapping(true)
    const href = mountCard('phpstorm://open?file=/elsewhere/HomeController.php&line=48')
      .get('a.vd-body__source').attributes('href')

    expect(href).toContain('/home/me/repos/spiral-apps/filters-bridge/app/src/Controller/HomeController.php')
    expect(href).not.toContain('/elsewhere/')
  })

  it('builds the link from Settings when the SDK sent none, a file:// or an unsafe one', () => {
    for (const fileLink of [undefined, `file://${FILE}#L48`, 'javascript:alert(1)']) {
      const href = mountCard(fileLink).get('a.vd-body__source').attributes('href')

      expect(href).toContain(FILE)
      expect(href).not.toContain('javascript')
    }
  })
})
