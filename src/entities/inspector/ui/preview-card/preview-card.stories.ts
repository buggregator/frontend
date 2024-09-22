import type { Meta, StoryObj } from '@storybook/vue3'
import { useInspector } from '../../lib'
import { inspectorMock } from '../../mocks'
import PreviewCard from './preview-card.vue'

const { normalizeInspectorEvent } = useInspector()

export default {
  title: 'Entities/inspector/PreviewCard',
  component: PreviewCard
} as Meta<typeof PreviewCard>

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeInspectorEvent(inspectorMock)
  }
}
