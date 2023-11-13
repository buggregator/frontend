import { Meta, Story } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallStatBoard from './call-stat-board.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "FSD/screens/profiler/CallStatBoard",
  component: CallStatBoard
} as Meta<typeof CallStatBoard>;

const Template: Story = (args) => ({
  components: { CallStatBoard },
  setup() {
    return {
      args,
    };
  },
  template: `<CallStatBoard v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  edge: normalizeProfilerEvent(profilerMock).payload.edges.e5
};
