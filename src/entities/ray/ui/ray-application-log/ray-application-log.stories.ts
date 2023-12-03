import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelApplicationLogMock } from '../../mocks-laravel';
import type { RayContentApplicationLog } from '../../types';
import RayApplicationLog from './ray-application-log.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayApplicationLog",
  component: RayApplicationLog
} as Meta<typeof RayApplicationLog>;

const Template: Story = (args) => ({
  components: { RayApplicationLog },
  setup() {
    return {
      args,
    };
  },
  template: `<RayApplicationLog v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayLaravelApplicationLogMock).payload.payloads[0].content as RayContentApplicationLog)
};
