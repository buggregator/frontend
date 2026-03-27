import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ProfileCompare from './profile-compare.vue'

export default {
  title: 'Screens/Profiler/ProfileCompare',
  component: ProfileCompare,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof ProfileCompare>

export const Default: StoryObj<typeof ProfileCompare> = {
  args: {
    baseId: '019d309d-9f5c-73e1-b878-5ced0145337b',
    compareId: '019d3069-b404-7107-9a21-5367e65ff79b',
  },
}
