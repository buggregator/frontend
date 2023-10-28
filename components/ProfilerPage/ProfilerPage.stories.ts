import { Meta, Story } from "@storybook/vue3";
import ProfilerPage from '~/components/ProfilerPage/ProfilerPage.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Profiler/Page/ProfilerPage",
  component: ProfilerPage
} as Meta<typeof ProfilerPage>;

const Template: Story = (args) => ({
  components: { ProfilerPage },
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilerPage v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: normalizeProfilerEvent(profilerMock),
};
