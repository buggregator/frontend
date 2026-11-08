import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { normalizeXdebugTraceEvent } from '../../lib'
import { xdebugTraceMock, xdebugTraceTruncatedMock } from '../../mocks'
import PreviewCard from './preview-card.vue'

export default {
  title: 'Entities/XdebugTrace/PreviewCard',
  component: PreviewCard
} as Meta<typeof PreviewCard>

export const Request: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeXdebugTraceEvent(xdebugTraceMock),
  }
}

export const CutCommand: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeXdebugTraceEvent(xdebugTraceTruncatedMock),
  }
}
