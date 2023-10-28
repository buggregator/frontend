import { Meta, Story } from "@storybook/vue3";
import { normalizeProfilerEvent } from "~/utils/normalize-event";
import ProfilerPageCallGraph from '~/components/ProfilerPageCallGraph/ProfilerPageCallGraph.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";

export default {
  title: "Profiler/Page/ProfilerPageCallGraph",
  component: ProfilerPageCallGraph
} as Meta<typeof ProfilerPageCallGraph>;

const Template: Story = (args) => ({
  components: { ProfilerPageCallGraph },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPageCallGraph v-bind="args" />`,
});

export const CallGraph = Template.bind({});

CallGraph.args = {
  event: normalizeProfilerEvent(profilerMock).payload,
};
