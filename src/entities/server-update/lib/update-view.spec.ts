import { describe, expect, it } from 'vitest'
import {
  availableStatus,
  checkOffStatus,
  doneThenNewerStatus,
  dockerStatus,
  doneStatus,
  downloadingStatus,
  failedStatus,
  installingStatus,
  memoryDbStatus,
  neverCheckedStatus,
  offStatus,
  restartRequiredStatus,
  restartingStatus,
  rolledBackStatus,
  upToDateStatus,
  verifyingStatus,
} from '../mocks'
import type { UpdateStatus } from '../types'
import { timeAgo, toUpdateView } from './update-view'

const NOW = Date.parse('2026-11-17T10:00:00Z')
const view = (status: UpdateStatus, extra: { checking?: boolean; loadedVersion?: string; fallbackVersion?: string } = {}) =>
  toUpdateView({
    status,
    now: NOW,
    loadedVersion: extra.loadedVersion ?? '2.9.0',
    checking: extra.checking ?? false,
    fallbackVersion: extra.fallbackVersion ?? '',
  })

const stepStates = (status: UpdateStatus) => view(status).steps.map((step) => `${step.id}:${step.state}`)
const actionKinds = (status: UpdateStatus) => view(status).actions.map((action) => action.kind)

describe('timeAgo', () => {
  it.each([
    ['2026-11-17T09:59:40Z', 'just now'],
    ['2026-11-17T09:55:00Z', '5 min ago'],
    ['2026-11-17T08:00:00Z', '2 h ago'],
    ['2026-11-14T10:00:00Z', '3 d ago'],
    ['2026-11-17T10:05:00Z', 'just now'],
  ])('%s → %s', (iso, text) => {
    expect(timeAgo(iso, NOW)).toBe(text)
  })

  it('is empty for a missing or broken date', () => {
    expect(timeAgo(undefined, NOW)).toBe('')
    expect(timeAgo('soon', NOW)).toBe('')
  })
})

describe('toUpdateView: before an update', () => {
  it('up to date: version, status, last check, no buttons', () => {
    const v = view(upToDateStatus)

    expect(v.kind).toBe('current')
    expect(v.version).toBe('2.10.0')
    expect(v.badge).toMatchObject({ tone: 'ok', text: 'Up to date' })
    expect(v.meta).toBe('Last checked 2 h ago')
    expect(v.canCheck).toBe(true)
    expect(v.actions).toEqual([])
    expect(v.notesTitle).toBe('')
  })

  it('never checked: says so, still offers a check', () => {
    const v = view(neverCheckedStatus)

    expect(v.badge).toMatchObject({ tone: 'muted', text: 'Not checked yet' })
    expect(v.meta).toBe('No check yet')
    expect(v.canCheck).toBe(true)
  })

  it('while checking the status says so', () => {
    expect(view(upToDateStatus, { checking: true }).badge).toMatchObject({ icon: 'spinner', text: 'Checking for updates' })
  })

  it('available in mode self: release notes and the update button', () => {
    const v = view(availableStatus)

    expect(v.kind).toBe('available')
    expect(v.badge).toMatchObject({ tone: 'new', text: '2.10.0 is available' })
    expect(v.actions).toEqual([
      { kind: 'release-notes', href: availableStatus.url },
      { kind: 'update', label: 'Update to 2.10.0', version: '2.10.0', danger: false },
    ])
    expect(v.memoryWarning).toBe(false)
    expect(v.hint).toContain('If 2.10.0 does not start, 2.9.0 is put back (after a crash: on the next start).')
    expect(v.notesTitle).toBe("What's new in 2.10.0")
  })

  it('memory database: red warning and a red button that says what it does', () => {
    const v = view(memoryDbStatus)

    expect(v.memoryWarning).toBe(true)
    expect(v.actions[1]).toEqual({ kind: 'update', label: 'Delete events and update', version: '2.10.0', danger: true })
  })

  it('Windows console: the hint says the person restarts it', () => {
    expect(view({ ...availableStatus, restart_manual: true }).hint).toContain('restart Buggregator yourself')
  })

  it('manual mode: no update button, the commands to run instead', () => {
    const v = view(dockerStatus)

    expect(actionKinds(dockerStatus)).toEqual(['release-notes'])
    expect(v.manual?.text).toBe(dockerStatus.reason)
    expect(v.manual?.commands.map((c) => c.label)).toEqual(['Docker', 'Compose', 'Helm'])
  })

  it('manual mode without a reason explains by the way it is installed', () => {
    const v = view({ ...dockerStatus, reason: '', install: 'kubernetes' })

    expect(v.manual?.text).toContain('Kubernetes')
  })

  it('off: a locked button and the reason, which names the setting', () => {
    const v = view(offStatus)

    expect(v.actions).toEqual([
      { kind: 'release-notes', href: offStatus.url },
      { kind: 'locked', label: 'Update to 2.10.0' },
    ])
    expect(v.offReason).toContain('update.self_update: on')
  })

  it('the version and the release notes stay visible in every mode', () => {
    for (const status of [availableStatus, dockerStatus, offStatus]) {
      const v = view(status)
      expect(v.version).toBe('2.9.0')
      expect(v.notesTitle).toBe("What's new in 2.10.0")
    }
  })
})

describe('toUpdateView: while it runs', () => {
  it('downloading: percent, MB of MB, the first step in progress', () => {
    const v = view(downloadingStatus)

    expect(v.kind).toBe('progress')
    expect(v.badge).toMatchObject({ icon: 'spinner', text: 'Updating to 2.10.0' })
    expect(v.progress).toEqual({ line: 'Downloading 2.10.0… 42%', percent: 42, restarting: false })
    expect(stepStates(downloadingStatus)).toEqual(['download:now', 'verify:waiting', 'install:waiting', 'restart:waiting'])
    expect(v.steps[0].aux).toBe('15.9 of 37.9 MB')
    expect(v.meta).toBe("Do not close the server's window")
    expect(v.steps[2].label).toBe('Install, keep 2.9.0 as backup')
    expect(v.actions).toEqual([])
    expect(v.canCheck).toBe(false)
  })

  it('a download of unknown size has no percent', () => {
    const v = view({ ...downloadingStatus, state: { ...downloadingStatus.state, total: 0 } })

    expect(v.progress?.percent).toBeNull()
    expect(v.progress?.line).toBe('Downloading 2.10.0…')
  })

  it('verifying and installing move the steps on, without a percent', () => {
    expect(stepStates(verifyingStatus)).toEqual(['download:done', 'verify:now', 'install:waiting', 'restart:waiting'])
    expect(view(verifyingStatus).progress?.percent).toBeNull()
    expect(stepStates(installingStatus)).toEqual(['download:done', 'verify:done', 'install:now', 'restart:waiting'])
    expect(view(installingStatus).steps[0].aux).toBe('37.9 MB')
  })

  it('restarting: the last step, and the restart flag for the notice', () => {
    const v = view(restartingStatus)

    expect(stepStates(restartingStatus)).toEqual(['download:done', 'verify:done', 'install:done', 'restart:now'])
    expect(v.progress?.restarting).toBe(true)
  })

  it('takes the old version from the tab when the server does not say it', () => {
    const status = { ...installingStatus, state: { ...installingStatus.state, previous: '' } }

    expect(view(status, { loadedVersion: '2.8.1' }).steps[2].label).toBe('Install, keep 2.8.1 as backup')
  })
})

describe('toUpdateView: how it ended', () => {
  it('done: the new version, from which one, what changed', () => {
    const v = view(doneStatus, { loadedVersion: '2.10.0' })

    expect(v.kind).toBe('done')
    expect(v.version).toBe('2.10.0')
    expect(v.badge).toMatchObject({ tone: 'ok', text: 'Updated from 2.9.0' })
    expect(v.meta).toBe('Updated 25 min ago')
    expect(v.notesTitle).toBe('What changed')
    expect(v.steps).toEqual([])
  })

  it('failed: on which step, the error, try again', () => {
    const v = view(failedStatus)

    expect(v.kind).toBe('failed')
    expect(v.badge).toMatchObject({ tone: 'bad', text: 'Update failed' })
    expect(v.failure).toEqual({ step: 'Download', error: 'connection reset after 15.9 of 37.9 MB', previous: '2.9.0' })
    expect(stepStates(failedStatus)).toEqual(['download:failed', 'verify:waiting', 'install:waiting', 'restart:waiting'])
    expect(v.actions).toEqual([{ kind: 'retry', version: '2.10.0', danger: false }])
  })

  it('failed on a later step marks the steps before it done', () => {
    const status = { ...failedStatus, state: { ...failedStatus.state, failed_step: 'verifying' } }

    expect(stepStates(status)).toEqual(['download:done', 'verify:failed', 'install:waiting', 'restart:waiting'])
    expect(view(status).failure?.step).toBe('Checksum check')
  })

  it('failed with an unknown step still shows the error', () => {
    const status = { ...failedStatus, state: { ...failedStatus.state, failed_step: '' } }

    expect(view(status).failure?.step).toBe('')
    expect(stepStates(status)).toEqual(['download:waiting', 'verify:waiting', 'install:waiting', 'restart:waiting'])
  })

  it('rolled back: copy log and report, no retry, no reload', () => {
    const v = view(rolledBackStatus)

    expect(v.kind).toBe('rolled_back')
    expect(v.badge).toMatchObject({ tone: 'warn', text: 'Rolled back from 2.10.0' })
    expect(actionKinds(rolledBackStatus)).toEqual(['copy-log', 'report'])
    const report = v.actions[1] as { href: string }
    expect(report.href.startsWith('https://github.com/buggregator/server/issues/new?')).toBe(true)
    expect(new URL(report.href).searchParams.get('body')).toContain('address already in use')
    expect(v.rollback).toEqual({ target: '2.10.0', previous: '2.9.0', error: rolledBackStatus.state.error })
    expect(v.log).toBe(rolledBackStatus.state.log)
  })

  // The server names the step `starting` when the new version did not start.
  it('rolled back marks the restart step failed', () => {
    expect(stepStates(rolledBackStatus)).toEqual(['download:done', 'verify:done', 'install:done', 'restart:failed'])
  })

  it('rolled back without a log copies the error', () => {
    expect(view({ ...rolledBackStatus, state: { ...rolledBackStatus.state, log: '' } }).log).toBe(rolledBackStatus.state.error)
  })

  it('restart required: installed, the person restarts it', () => {
    const v = view(restartRequiredStatus)

    expect(v.kind).toBe('restart_required')
    expect(v.badge).toMatchObject({ tone: 'warn', text: '2.10.0 installed, waiting for restart' })
    expect(v.actions).toEqual([])
    expect(v.canCheck).toBe(false)
  })
})

// The server keeps done, failed and rolled_back until the next update starts,
// also when a newer release comes out meanwhile.
describe('toUpdateView: an old result and a newer release', () => {
  it('done for an older version: the newer release is offered', () => {
    const v = view(doneThenNewerStatus, { loadedVersion: '2.10.0' })

    expect(v.kind).toBe('available')
    expect(v.badge.text).toBe('2.11.0 is available')
    expect(v.actions[1]).toMatchObject({ kind: 'update', version: '2.11.0', label: 'Update to 2.11.0' })
    expect(v.notesTitle).toBe("What's new in 2.11.0")
    expect(v.hint).toContain('If 2.11.0 does not start, 2.10.0 is put back')
  })

  it.each([
    ['failed', failedStatus],
    ['rolled back', rolledBackStatus],
    ['restart required', restartRequiredStatus],
  ])('%s for an older version: the newer release is offered', (_, status) => {
    const v = view({ ...status, latest: '2.11.0', available: true })

    expect(v.kind).toBe('available')
    expect(v.steps).toEqual([])
  })

  // Reviewer's cases, live against server master.
  it('done 9.1.0 with 9.2.0 out offers «Update to 9.2.0»; rolled back 9.2.0 with 9.2.1 out offers 9.2.1', () => {
    const done = { ...doneStatus, current: '9.1.0', latest: '9.2.0', available: true, state: { ...doneStatus.state, version: '9.1.0', previous: '9.0.0' } }
    expect(view(done, { loadedVersion: '9.1.0' }).actions[1]).toMatchObject({ label: 'Update to 9.2.0' })

    const rolled = { ...rolledBackStatus, current: '9.1.0', latest: '9.2.1', available: true, state: { ...rolledBackStatus.state, version: '9.2.0', previous: '9.1.0' } }
    expect(view(rolled, { loadedVersion: '9.1.0' }).actions[1]).toMatchObject({ label: 'Update to 9.2.1' })
  })

  it('a result about the latest release stays shown', () => {
    expect(view(failedStatus).kind).toBe('failed')
    expect(view({ ...doneStatus, latest: '' }, { loadedVersion: '2.10.0' }).kind).toBe('done')
  })
})

describe('toUpdateView: update check off', () => {
  it('no Check now, and the version from /api/settings', () => {
    const v = view(checkOffStatus, { fallbackVersion: '2.9.0' })

    expect(v.canCheck).toBe(false)
    expect(v.version).toBe('2.9.0')
    expect(v.meta).toBe('Update checks are off')
  })
})
