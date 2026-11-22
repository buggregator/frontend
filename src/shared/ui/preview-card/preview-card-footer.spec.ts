import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import PreviewCardFooter from './preview-card-footer.vue'

describe('PreviewCardFooter', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('opens the file in the editor without a new tab (frontend#289)', () => {
    const wrapper = mount(PreviewCardFooter, {
      props: { originConfig: { file: '/app/src/Foo.php', line_number: '12' } },
    })
    const links = wrapper.findAll('a.pc-footer__tag--link')
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.attributes('href')).toMatch(/^\w+:\/\/.*Foo\.php/)
      expect(link.attributes('target')).toBeUndefined()
    }
  })
})
