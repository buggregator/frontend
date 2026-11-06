import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PauseButton from './pause-button.vue'

// Audit 5.15: the button was named by its state and had no name at 390 px.
describe('PauseButton', () => {
  it('is named by its state and the action a press takes', () => {
    const live = mount(PauseButton, { props: { isPaused: false, disabledPause: false, totalNewEventsCount: 0 } })
    expect(live.get('button').attributes('aria-label')).toBe('Listening. Pause live updates')

    const paused = mount(PauseButton, { props: { isPaused: true, disabledPause: false, totalNewEventsCount: 3 } })
    expect(paused.get('button').attributes('aria-label')).toBe('Paused, 3 new events. Resume live updates')
  })
})
