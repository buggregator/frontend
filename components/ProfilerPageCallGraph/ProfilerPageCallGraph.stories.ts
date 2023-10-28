import { Meta, Story } from "@storybook/vue3";
import ProfilerPageCallGraph from '~/components/ProfilerPageCallGraph/ProfilerPageCallGraph.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

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
