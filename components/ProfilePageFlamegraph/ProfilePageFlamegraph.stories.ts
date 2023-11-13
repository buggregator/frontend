import {Meta, Story} from "@storybook/vue3";
import { Profiler } from "~/src/entities/profiler/types";
import ProfilePageFlamegraph from '~/components/ProfilePageFlamegraph/ProfilePageFlamegraph.vue';
import { profilerMock } from  "~/src/entities/profiler/mocks";
import { useProfiler } from "~/src/entities/profiler/lib";

const { normalizeProfilerEvent } = useProfiler();

export default {
  title: "Profiler/Page/ProfilePageFlamegraph",
  component: ProfilePageFlamegraph
} as Meta<typeof ProfilePageFlamegraph>;

const Template: Story = (args) => ({
  components: {ProfilePageFlamegraph},
  setup() {
    return {
      args,
    };
  },
  template: `<ProfilePageFlamegraph style="width: 100%; height: 100vh" v-bind="args"/>`,
});

export const Default = Template.bind({});

Default.args = {
  edges: (normalizeProfilerEvent(profilerMock).payload as Profiler).edges,
};
