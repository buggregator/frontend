import type { Meta, StoryObj } from "@storybook/vue3";
import { monologMock } from '@/entities/monolog/mocks'
import { useEvents } from "@/shared/lib/use-events";
import PreviewCardDefault from './preview-card-default.vue';

const { normalizeUnknownEvent } = useEvents();

export default {
  title: "Widgets/PreviewCardDefault",
  component: PreviewCardDefault
} as Meta<typeof PreviewCardDefault>;

export const Default: StoryObj<typeof PreviewCardDefault> = {
  args: {
    event: normalizeUnknownEvent({ ...monologMock, type: 'unknown' }),
  }
}
