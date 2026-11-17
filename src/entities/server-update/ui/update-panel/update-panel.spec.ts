import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  availableStatus,
  dockerStatus,
  doneStatus,
  downloadingStatus,
  failedStatus,
  installingStatus,
  memoryDbStatus,
  offStatus,
  restartRequiredStatus,
  restartingStatus,
  rolledBackStatus,
  upToDateStatus,
} from '../../mocks'
import type { UpdateStatus } from '../../types'
import UpdatePanel from './update-panel.vue'

const NOW = Date.parse('2026-11-17T10:00:00Z')

const render = (status: UpdateStatus, props: Record<string, unknown> = {}) =>
  mount(UpdatePanel, { props: { status, loadedVersion: '2.9.0', now: NOW, ...props } })

const buttons = (wrapper: ReturnType<typeof render>) =>
  wrapper.findAll('[data-test="update-actions"] > *').map((el) => el.text().trim())

describe('UpdatePanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('up to date: version, status, check link, no buttons', () => {
    const wrapper = render(upToDateStatus)

    expect(wrapper.get('[data-test="update-version"]').text()).toBe('v2.10.0')
    expect(wrapper.get('[data-test="update-badge"]').text()).toBe('Up to date')
    expect(wrapper.get('[data-test="update-badge"]').attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Last checked 2 h ago')
    expect(buttons(wrapper)).toEqual([])
  })

  it('Check now asks for a check; while checking it says so', async () => {
    const wrapper = render(upToDateStatus)

    await wrapper.get('button[data-test="update-check"]').trigger('click')
    expect(wrapper.emitted('check')).toHaveLength(1)

    await wrapper.setProps({ checking: true })
    expect(wrapper.find('button[data-test="update-check"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="update-checking"]').text()).toBe('Checking…')
  })

  it('shows a refused check as a status message', () => {
    const wrapper = render(upToDateStatus, { checkMessage: 'Checked less than a minute ago. Try again in 42 s.' })

    const message = wrapper.get('[data-test="update-check-message"]')
    expect(message.attributes('role')).toBe('status')
    expect(message.text()).toContain('Try again in 42 s.')
  })

  it('available: release notes in a new tab and «Update to», which starts the update', async () => {
    const wrapper = render(availableStatus)

    expect(buttons(wrapper)).toEqual(['Release notes (opens in a new tab)', 'Update to 2.10.0'])
    const notes = wrapper.get('[data-test="update-actions"] a')
    expect(notes.attributes('target')).toBe('_blank')
    expect(notes.attributes('rel')).toContain('noopener')

    await wrapper.get('button[data-test="update-start"]').trigger('click')
    expect(wrapper.emitted('start')).toEqual([['2.10.0']])
    expect(wrapper.get('[data-test="update-notes"]').html()).toContain('<h4>Added</h4>')
    expect(wrapper.get('[data-test="update-notes"] h3').text()).toBe("What's new in 2.10.0")
  })

  it('memory database: a red warning and a red button', () => {
    const wrapper = render(memoryDbStatus)

    expect(wrapper.get('[data-test="update-memory-warning"]').text()).toContain('Updating deletes all events')
    const start = wrapper.get('button[data-test="update-start"]')
    expect(start.text()).toBe('Delete events and update')
    expect(start.classes()).toContain('upd__btn--danger')
  })

  it('a refused start is announced as an alert', () => {
    const wrapper = render(availableStatus, { actionError: 'An update is already running.' })

    expect(wrapper.get('[data-test="update-action-error"]').attributes('role')).toBe('alert')
  })

  it('manual: commands to copy instead of the button', () => {
    const wrapper = render(dockerStatus)

    expect(wrapper.find('button[data-test="update-start"]').exists()).toBe(false)
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual(['Docker', 'Compose', 'Helm'])
    expect(wrapper.text()).toContain(dockerStatus.reason)
  })

  it('off: a locked button that does nothing, and the reason', async () => {
    const wrapper = render(offStatus)

    const locked = wrapper.get('[data-test="update-locked"]')
    expect(locked.attributes('aria-disabled')).toBe('true')
    await locked.trigger('click')
    expect(wrapper.emitted('start')).toBeUndefined()
    expect(wrapper.get('[data-test="update-off-reason"]').text()).toContain('update.self_update: on')
  })

  it('downloading: a progress bar with the percent and the steps', () => {
    const wrapper = render(downloadingStatus)

    const bar = wrapper.get('[role="progressbar"]')
    expect(bar.attributes('aria-valuenow')).toBe('42')
    expect(wrapper.text()).toContain('Downloading 2.10.0… 42%')
    expect(wrapper.get('[data-step="download"]').text()).toContain('Download: in progress')
    expect(buttons(wrapper)).toEqual([])
  })

  it('a step without a percent has a bar with no value', () => {
    const bar = render(installingStatus).get('[role="progressbar"]')

    expect(bar.attributes('aria-valuenow')).toBeUndefined()
  })

  it('restarting: says events are not received and the page reloads by itself', () => {
    const wrapper = render(restartingStatus)

    expect(wrapper.text()).toContain('events sent now are not received')
    expect(wrapper.text()).toContain('reloads by itself')
  })

  it('restart taking too long: an alert and a Reload button', async () => {
    const wrapper = render(restartingStatus, { restartGaveUp: true })

    expect(wrapper.get('[data-test="update-gave-up"]').attributes('role')).toBe('alert')
    await wrapper.get('[data-test="update-gave-up"] button').trigger('click')
    expect(wrapper.emitted('reload')).toHaveLength(1)
  })

  it('done: updated to the new version, what changed', () => {
    const wrapper = render(doneStatus, { loadedVersion: '2.10.0' })

    expect(wrapper.get('[data-test="update-done"]').text()).toContain('Updated to 2.10.0')
    expect(wrapper.get('[data-test="update-notes"] h3').text()).toBe('What changed')
  })

  it('failed: on which step, the error, nothing changed, try again', async () => {
    const wrapper = render(failedStatus)

    const failure = wrapper.get('[data-test="update-failure"]')
    expect(failure.attributes('role')).toBe('alert')
    expect(failure.text()).toContain('Download failed: connection reset after 15.9 of 37.9 MB')
    expect(failure.text()).toContain('Nothing was changed; 2.9.0 keeps running.')
    expect(wrapper.get('[data-step="download"]').text()).toContain('Download: failed')

    await wrapper.get('button[data-test="update-retry"]').trigger('click')
    expect(wrapper.emitted('start')).toEqual([['2.10.0']])
  })

  it('rolled back: what happened, Copy log, Report the problem; no reload', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = render(rolledBackStatus)

    const notice = wrapper.get('[data-test="update-rollback"]')
    expect(notice.attributes('role')).toBe('alert')
    expect(notice.text()).toContain('2.10.0 did not start')
    expect(notice.text()).toContain('2.9.0 is back. exited 3 s after start')
    expect(buttons(wrapper)).toEqual(['Copy log', 'Report the problem (opens in a new tab)'])

    await wrapper.get('button[data-test="update-copy-log"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(rolledBackStatus.state.log)
    expect(wrapper.get('button[data-test="update-copy-log"]').text()).toBe('Log copied')
    expect(wrapper.emitted('reload')).toBeUndefined()
  })

  it('restart required: installed, two steps to restart it by hand', () => {
    const wrapper = render(restartRequiredStatus)

    const notice = wrapper.get('[data-test="update-restart-required"]')
    expect(notice.text()).toContain('2.10.0 is installed — restart it yourself')
    expect(notice.findAll('li').map((li) => li.text())).toEqual([
      'Press Ctrl+C in the window where Buggregator runs.',
      'Start it again the same way.',
    ])
  })
})
