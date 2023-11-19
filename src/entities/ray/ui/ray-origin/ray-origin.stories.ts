import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayCallerMock } from '../../mocks';
import { RayPayloadOrigin } from '../../types';
import RayOrigin from './ray-origin.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayOrigin",
  component: RayOrigin
} as Meta<typeof RayOrigin>;

const Template: Story = (args) => ({
  components: { RayOrigin },
  setup() {
    return {
      args,
    };
  },
  template: `<RayOrigin v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  origin: (normalizeRayEvent(rayCallerMock).payload.payloads[0].origin as RayPayloadOrigin)
};
