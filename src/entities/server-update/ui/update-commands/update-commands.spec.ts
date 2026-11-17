import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dockerStatus } from '../../mocks'
import UpdateCommands from './update-commands.vue'

const commands = dockerStatus.commands!

describe('UpdateCommands', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('shows tabs for several commands and the first one', () => {
    const wrapper = mount(UpdateCommands, { props: { commands } })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((tab) => tab.text())).toEqual(['Docker', 'Compose', 'Helm'])
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.get('[role="tabpanel"] code').text()).toBe(commands[0].command)
  })

  it('switches the command by click and by arrow keys', async () => {
    const wrapper = mount(UpdateCommands, { props: { commands }, attachTo: document.body })

    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    expect(wrapper.get('[role="tabpanel"] code').text()).toBe(commands[1].command)

    await wrapper.findAll('[role="tab"]')[1].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('[role="tabpanel"] code').text()).toBe(commands[2].command)
    expect(document.activeElement).toBe(wrapper.findAll('[role="tab"]')[2].element)
    // Only the selected tab is in the Tab order.
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '-1', '0'])

    await wrapper.findAll('[role="tab"]')[2].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('[role="tabpanel"] code').text()).toBe(commands[0].command)
    wrapper.unmount()
  })

  it('has no tabs for a single command', () => {
    const wrapper = mount(UpdateCommands, { props: { commands: [commands[0]] } })

    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    expect(wrapper.get('code').text()).toBe(commands[0].command)
  })

  it('copies the shown command and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(UpdateCommands, { props: { commands } })

    await wrapper.get('button[data-test="copy-command"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(commands[0].command)
    expect(wrapper.get('button[data-test="copy-command"]').text()).toContain('Copied')
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Command copied')
  })
})
