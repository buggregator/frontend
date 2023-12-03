import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelJobsMock } from '../../mocks-laravel';
import type { RayContentJob } from '../../types';
import RayJob from './ray-job.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayJob",
  component: RayJob
} as Meta<typeof RayJob>;

const Template: Story = (args) => ({
  components: { RayJob },
  setup() {
    return {
      args,
    };
  },
  template: `<RayJob v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayLaravelJobsMock).payload.payloads[0].content as RayContentJob)
};
