import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLockMock } from '../../mocks'
import { RayContentLock } from '../../types'
import RayLock from './ray-lock.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "FSD/entities/ray/RayLock",
  component: RayLock
} as Meta<typeof RayLock>;

const Template: Story = (args) => ({
  components: { RayLock },
  setup() {
    return {
      args,
    };
  },
  template: `<RayLock v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  name: (normalizeRayEvent(rayLockMock).payload.payloads[0].content as RayContentLock).name
};
