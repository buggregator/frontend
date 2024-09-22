import type { Meta, StoryObj } from '@storybook/vue3'
import EventPage from './event-page.vue'

export default {
  title: 'Screens/EventPage/EventPage',
  component: EventPage
} as Meta<typeof EventPage>

export const Default: StoryObj<typeof EventPage> = {
  args: {}
}
