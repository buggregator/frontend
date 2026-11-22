import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EditorLink from './editor-link.vue'

describe('EditorLink', () => {
  const render = () =>
    mount(EditorLink, {
      props: { href: 'vscode://file//app/src/Foo.php:12' },
      attrs: { class: 'frame__fn', title: '/app/src/Foo.php:12' },
      slots: { default: 'Foo.php' },
    })

  it('opens the editor in place: no new tab, so Firefox leaves no blank tab (frontend#289)', () => {
    const link = render().get('a')
    expect(link.attributes('href')).toBe('vscode://file//app/src/Foo.php:12')
    expect(link.attributes('target')).toBeUndefined()
  })

  it('keeps the caller class, attributes and content', () => {
    const link = render().get('a')
    expect(link.classes()).toContain('frame__fn')
    expect(link.attributes('title')).toBe('/app/src/Foo.php:12')
    expect(link.text()).toBe('Foo.php')
  })

  it('does not toggle the card or row around it on click', async () => {
    const wrapper = mount({
      components: { EditorLink },
      data: () => ({ toggled: 0 }),
      template: '<div @click="toggled++"><EditorLink href="vscode://file//a.php">a</EditorLink></div>',
    })
    await wrapper.get('a').trigger('click')
    expect(wrapper.vm.toggled).toBe(0)
  })
})
