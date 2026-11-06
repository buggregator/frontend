import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StatusPanel from './status-panel.vue'

export default {
  title: 'Shared/StatusPanel',
  component: StatusPanel,
} as Meta<typeof StatusPanel>

export const LoadError: StoryObj<typeof StatusPanel> = {
  args: {
    tone: 'error',
    title: 'Could not load events',
    text: 'The server answered 500.',
    actionLabel: 'Try again',
  },
}

export const Empty: StoryObj<typeof StatusPanel> = {
  args: {
    title: 'No favorites yet',
    text: 'Pin an event to keep it here.',
  },
}
