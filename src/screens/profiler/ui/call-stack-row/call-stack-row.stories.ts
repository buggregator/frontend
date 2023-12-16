import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from '~/src/entities/profiler';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallStackRow from './call-stack-row.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/CallStackRow",
  component: CallStackRow
} as Meta<typeof CallStackRow>;

export const Default: StoryObj<typeof CallStackRow> = {
  args: {
    edge: normalizeProfilerEvent(profilerMock).payload.edges.e5,
  }
};
