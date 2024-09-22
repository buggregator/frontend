import type { Meta, StoryObj } from '@storybook/vue3'
import NotFoundPage from './not-found-page.vue'

export default {
  title: 'Screens/NotFound/NotFoundPage',
  component: NotFoundPage
} as Meta<typeof NotFoundPage>

export const Default: StoryObj<typeof NotFoundPage> = {
  args: {}
}
