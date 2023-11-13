import { Meta, Story } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallGraph from './call-graph.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "FSD/screens/profiler/CallGraph",
  component: CallGraph
} as Meta<typeof CallGraph>;

const Template: Story = (args) => ({
  components: { CallGraph },
  setup() {
    return {
      args,
    };
  },
  template: `<CallGraph v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  payload: normalizeProfilerEvent(profilerMock).payload,
};
