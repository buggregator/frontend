import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from "@/entities/profiler";
import { profilerMock } from  "@/entities/profiler/mocks";
import CallGraph from './call-graph.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/CallGraph",
  component: CallGraph
} as Meta<typeof CallGraph>;


export const Default: StoryObj<typeof CallGraph> = {
  args: {
    payload: normalizeProfilerEvent(profilerMock).payload,
  }
};
