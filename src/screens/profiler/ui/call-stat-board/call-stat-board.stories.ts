import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallStatBoard from './call-stat-board.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/CallStatBoard",
  component: CallStatBoard
} as Meta<typeof CallStatBoard>;

export const Default: StoryObj<typeof CallStatBoard> = {
  args: {
    edge: normalizeProfilerEvent(profilerMock).payload.edges.e5
  }
};
