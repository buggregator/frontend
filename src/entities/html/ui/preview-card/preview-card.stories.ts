import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { normalizeHtmlEvent } from '../../lib'
import { htmlReportMock, htmlTruncatedMock } from '../../mocks'
import PreviewCard from './preview-card.vue'

export default {
  title: 'Entities/Html/PreviewCard',
  component: PreviewCard
} as Meta<typeof PreviewCard>

export const Default: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeHtmlEvent(htmlReportMock) }
}

// Over 32 KB: the feed preview has the text, not the markup.
export const Truncated: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeHtmlEvent(htmlTruncatedMock) }
}
