import type { Meta, StoryObj } from "@storybook/vue3";
import { useProfiler } from "../../lib";
import { profilerMock } from  "../../mocks";
import ProfilerPage from './profiler-page.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Entities/Profiler/ProfilerPage",
  component: ProfilerPage
} as Meta<typeof ProfilerPage>;

export const Default: StoryObj<typeof ProfilerPage> = {
  args: {
    event: normalizeProfilerEvent(profilerMock),
  }
};
