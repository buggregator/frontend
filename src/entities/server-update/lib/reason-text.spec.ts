import { describe, expect, it } from 'vitest'
import { reasonParts } from './reason-text'

const render = (text: string) => reasonParts(text).map((p) => (p.code ? `[${p.text}]` : p.text)).join('')

describe('reasonParts', () => {
  // Real reason strings of buggregator/server internal/selfupdate/mode.go.
  it('puts settings and env variables in code and starts with a capital', () => {
    expect(render('updates from the UI are off: set update.self_update: auto (env UPDATE_SELF=auto)')).toBe(
      'Updates from the UI are off: set [update.self_update: auto] (env [UPDATE_SELF=auto])'
    )
    expect(render('the update check is off: set update_check.enabled: true (env UPDATE_CHECK_ENABLED=true)')).toBe(
      'The update check is off: set [update_check.enabled: true] (env [UPDATE_CHECK_ENABLED=true])'
    )
  })

  it('keeps text without settings as it is, capitalised', () => {
    expect(render('running in a container: pull the new image and re-create the container')).toBe(
      'Running in a container: pull the new image and re-create the container'
    )
  })

  it('takes backticked parts as code', () => {
    expect(render('set `update.self_update` first')).toBe('Set [update.self_update] first')
  })

  it('is empty for no text', () => {
    expect(reasonParts('')).toEqual([])
  })
})
