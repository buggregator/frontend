import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from "@/entities/profiler";
import { profilerMock } from  "@/entities/profiler/mocks";
import ProfilerPage from './profiler-page.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/ProfilerPage",
  component: ProfilerPage
} as Meta<typeof ProfilerPage>;

export const Default: StoryObj<typeof ProfilerPage> = {
  args: {
    event: normalizeProfilerEvent(profilerMock),
  }
};
