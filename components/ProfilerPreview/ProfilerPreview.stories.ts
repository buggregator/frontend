import { Meta, Story } from "@storybook/vue3";
import ProfilerPreview from '~/components/ProfilerPreview/ProfilerPreview.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Profiler/Components/ProfilerPreview",
  component: ProfilerPreview
} as Meta<typeof ProfilerPreview>;

const Template: Story = (args) => ({
  components: { ProfilerPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPreview v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeProfilerEvent(profilerMock),
};
