import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayColorMock } from '../../mocks'
import { RayContentLog } from '../../types'
import RayLog from './ray-log.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "FSD/entities/ray/RayLog",
  component: RayLog
} as Meta<typeof RayLog>;

const Template: Story = (args) => ({
  components: { RayLog },
  setup() {
    return {
      args,
    };
  },
  template: `<RayLog v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  log: (normalizeRayEvent(rayColorMock).payload.payloads[0].content as RayContentLog).values[0]
};
