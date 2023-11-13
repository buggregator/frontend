import { Meta, Story } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import ProfilerPage from './profiler-page.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "FSD/screens/profiler/ProfilerPage",
  component: ProfilerPage
} as Meta<typeof ProfilerPage>;

const Template: Story = (args) => ({
  components: { ProfilerPage },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPage v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: normalizeProfilerEvent(profilerMock),
};
