import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SearchBar from './search-bar.vue'

export default {
  title: 'Shared/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof SearchBar>

export const Default: StoryObj<typeof SearchBar> = {}

export const WithQuery: StoryObj<typeof SearchBar> = {
  args: {
    modelValue: 'error log',
  },
}
