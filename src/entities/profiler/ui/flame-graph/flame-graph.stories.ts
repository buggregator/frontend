import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { useProfiler } from "../../lib";
import { profilerMock } from  "../../mocks";
import type { Profiler } from "../../types";
import FlameGraph from './flame-graph.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Screens/profiler/FlameGraph",
  component: FlameGraph,
  render: (args: ComponentProps<typeof FlameGraph>) => ({
    components: {FlameGraph},
    setup () {
      return {
        args,
      };
    },
    template: `<FlameGraph style="width: 100%; height: 100vh" v-bind="args"/>`,
  }),
} as Meta<typeof FlameGraph>;


export const Default: StoryObj<typeof FlameGraph> = {
  args: {
    payload: (normalizeProfilerEvent(profilerMock).payload as Profiler),
  }
};
