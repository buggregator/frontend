import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallStack from './call-stack.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/CallStack",
  component: CallStack
} as Meta<typeof CallStack>;

export const Default: StoryObj<typeof CallStack> = {
  args: {
    payload: normalizeProfilerEvent(profilerMock).payload,
  }
}

