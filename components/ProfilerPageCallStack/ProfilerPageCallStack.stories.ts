import { Meta, Story } from "@storybook/vue3";
import ProfilerPageCallStack from '~/components/ProfilerPageCallStack/ProfilerPageCallStack.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Profiler/Page/ProfilerPageCallStack",
  component: ProfilerPageCallStack
} as Meta<typeof ProfilerPageCallStack>;

const Template: Story = (args) => ({
  components: { ProfilerPageCallStack },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPageCallStack v-bind="args" />`,
});

export const List = Template.bind({});

List.args = {
  event: normalizeProfilerEvent(profilerMock).payload,
};
