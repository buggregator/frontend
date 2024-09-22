import type { Meta, StoryObj } from '@storybook/vue3'
import { useProfiler } from '../../lib'
import { profilerMock } from '../../mocks'
import PreviewCard from './preview-card.vue'

const { normalizeProfilerEvent } = useProfiler()

export default {
  title: 'Entities/Profiler/PreviewCard',
  component: PreviewCard
} as Meta<typeof PreviewCard>

export const Event: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeProfilerEvent(profilerMock)
  }
}
