import type { Meta, Story } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import type { Profiler } from "~/src/entities/profiler/types";
import FlameGraph from './flame-graph.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/FlameGraph",
  component: FlameGraph
} as Meta<typeof FlameGraph>;

const Template: Story = (args) => ({
  components: {FlameGraph},
  setup() {
    return {
      args,
    };
  },
  template: `<FlameGraph style="width: 100%; height: 100vh" v-bind="args"/>`,
});

export const Default = Template.bind({});

Default.args = {
  edges: (normalizeProfilerEvent(profilerMock).payload as Profiler).edges,
};
