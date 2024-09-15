import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { profilerMock } from  "../../mocks";
import FlameGraph from './flame-graph.vue';


export default {
  title: "Entities/Profiler/FlameGraph",
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
    id: profilerMock.uuid,
  }
};
