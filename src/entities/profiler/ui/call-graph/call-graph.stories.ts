import type { Meta, StoryObj } from "@storybook/vue3";
import { profilerMock } from "../../mocks";
import CallGraph from "./call-graph.vue";

export default {
  title: "Entities/Profiler/CallGraph",
  component: CallGraph
} as Meta<typeof CallGraph>;

export const Default: StoryObj<typeof CallGraph> = {
  args: {
    id: profilerMock.uuid
  }
};
