import { Meta, Story } from "@storybook/vue3";
import { normalizeProfilerEvent } from "~/utils/normalize-event";
import ProfilerPageCallStackRow from '~/components/ProfilerPageCallStackRow/ProfilerPageCallStackRow.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";

export default {
  title: "Profiler/Page/ProfilerPageCallStackRow",
  component: ProfilerPageCallStackRow
} as Meta<typeof ProfilerPageCallStackRow>;

const Template: Story = (args) => ({
  components: { ProfilerPageCallStackRow },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPageCallStackRow v-bind="args" />`,
});

export const Row = Template.bind({});

Row.args = {
  edge: normalizeProfilerEvent(profilerMock).payload.edges.e5,
};
