import type { Meta, StoryObj } from '@storybook/vue3'
import PageEventHeader from './page-event-header.vue'

const PageEventHeaderMeta: Meta<typeof PageEventHeader> = {
  title: 'Widgets/PageEventHeader',
  component: PageEventHeader
}

export default PageEventHeaderMeta

export const Default: StoryObj<typeof PageEventHeader> = {
  args: {
    title: 'Monolog',
    eventId: '1'
  }
}
