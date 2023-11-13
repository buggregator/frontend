import { Meta, Story } from "@storybook/vue3";
import { useProfiler } from "~/src/entities/profiler";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import CallStack from './call-stack.vue';

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "FSD/screens/profiler/CallStack",
  component: CallStack
} as Meta<typeof CallStack>;

const Template: Story = (args) => ({
  components: { CallStack },
  setup() {
    return {
      args,
    };
  },
  template: `<CallStack v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  payload: normalizeProfilerEvent(profilerMock).payload,
};
