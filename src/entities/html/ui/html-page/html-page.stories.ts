import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { normalizeHtmlEvent } from '../../lib'
import { htmlReportMock } from '../../mocks'
import HtmlPage from './html-page.vue'

export default {
  title: 'Entities/Html/Page',
  component: HtmlPage,
  parameters: { layout: 'fullscreen' }
} as Meta<typeof HtmlPage>

export const Default: StoryObj<typeof HtmlPage> = {
  args: { event: normalizeHtmlEvent(htmlReportMock) }
}
