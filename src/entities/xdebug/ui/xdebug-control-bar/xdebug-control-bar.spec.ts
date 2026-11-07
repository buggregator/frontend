import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import XdebugControlBar from './xdebug-control-bar.vue'

const props = (over = {}) => ({
  canControl: true, pending: null, drivenByIde: false, running: false, agentDriving: false, idleLeft: '9:12', lastBy: '', ...over
})

describe('XdebugControlBar', () => {
  it('sends continue and steps when the session is paused here', async () => {
    const w = mount(XdebugControlBar, { props: props() })
    await w.get('[aria-label="Continue"]').trigger('click')
    await w.get('[aria-label="Step over"]').trigger('click')
    expect(w.emitted('command')).toEqual([['run'], ['step-over']])
    expect(w.text()).toContain('9:12')
  })

  it('disables everything while running and says so', () => {
    const w = mount(XdebugControlBar, { props: props({ canControl: false, running: true }) })
    expect(w.findAll('button').every((b) => b.attributes('aria-disabled') === 'true')).toBe(true)
    expect(w.text()).toContain('Running…')
    expect(w.text()).not.toContain('9:12')
  })

  it('ignores clicks while disabled and keeps the buttons focusable', async () => {
    const w = mount(XdebugControlBar, { props: props({ canControl: false, running: true }) })
    await w.get('[aria-label="Step over"]').trigger('click')
    await w.get('[aria-label="Stop"]').trigger('click')
    expect(w.emitted('command')).toBeUndefined()
    expect(w.find('[role="alertdialog"]').exists()).toBe(false)
    expect(w.get('[aria-label="Step over"]').attributes('disabled')).toBeUndefined()
  })

  it('shows no buttons while an IDE drives, only the reason', () => {
    const w = mount(XdebugControlBar, { props: props({ canControl: false, drivenByIde: true, idleLeft: '' }) })
    expect(w.findAll('button')).toHaveLength(0)
    expect(w.text()).toContain('Driven by your IDE')
  })

  it('asks before Stop; Release instead and Esc are the other ways out', async () => {
    const w = mount(XdebugControlBar, { props: props(), attachTo: document.body })
    await w.get('[aria-label="Stop"]').trigger('click')
    expect(w.find('[role="alertdialog"]').exists()).toBe(true)
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    expect(w.emitted('command')).toBeUndefined()

    await w.get('[role="alertdialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="alertdialog"]').exists()).toBe(false)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Stop')

    await w.get('[aria-label="Stop"]').trigger('click')
    const [, release, stop] = w.get('[role="alertdialog"]').findAll('button')
    await release.trigger('click')
    await w.get('[aria-label="Stop"]').trigger('click')
    await w.get('[role="alertdialog"]').findAll('button')[2].trigger('click')
    expect(stop.text()).toBe('Stop request')
    expect(w.emitted('command')).toEqual([['detach'], ['stop']])
    w.unmount()
  })

  it('drops an open Stop confirm when the script moves on, so a later pause is never stopped', async () => {
    const w = mount(XdebugControlBar, { props: props() })
    await w.get('[aria-label="Stop"]').trigger('click')
    expect(w.find('[role="alertdialog"]').exists()).toBe(true)

    await w.setProps({ canControl: false, running: true })
    expect(w.find('[role="alertdialog"]').exists()).toBe(false)
    await w.setProps({ canControl: true, running: false })
    expect(w.find('[role="alertdialog"]').exists()).toBe(false)
    expect(w.emitted('command')).toBeUndefined()
  })
})
