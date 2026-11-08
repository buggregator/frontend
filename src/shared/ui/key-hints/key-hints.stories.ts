import type { Meta, StoryObj } from '@storybook/vue3-vite'
import KeyHints from './key-hints.vue'

export default {
  title: 'Shared/KeyHints',
  component: KeyHints,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof KeyHints>

export const UnderAnInput: StoryObj<typeof KeyHints> = {
  args: {
    hints: [
      { caps: ['↑', '↓'], label: 'pick a file' },
      { caps: ['Enter'], label: 'add' },
      { caps: ['Esc'], label: 'close the list' },
    ],
  },
}
