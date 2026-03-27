import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ProfileSummaryCard from './profile-summary-card.vue'

export default {
  title: 'Screens/Profiler/ProfileSummaryCard',
  component: ProfileSummaryCard,
  parameters: {
    layout: 'centered',
  },
} as Meta<typeof ProfileSummaryCard>

export const Default: StoryObj<typeof ProfileSummaryCard> = {
  args: {
    profileId: '019d309d-9f5c-73e1-b878-5ced0145337b',
  },
}
