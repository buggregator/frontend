import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HighlightText from './highlight-text.vue'

export default {
  title: 'Shared/HighlightText',
  component: HighlightText,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof HighlightText>

export const Default: StoryObj<typeof HighlightText> = {
  args: {
    text: 'App\\Http\\Controllers\\UserController::index',
  },
}
