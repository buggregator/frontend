import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayCallerMock } from '../../mocks';
import { RayContentFrame } from '../../types';
import RayFrame from './ray-frame.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "FSD/entities/ray/RayFrame",
  component: RayFrame
} as Meta<typeof RayFrame>;

const Template: Story = (args) => ({
  components: { RayFrame },
  setup() {
    return {
      args,
    };
  },
  template: `<RayFrame v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  frame: (normalizeRayEvent(rayCallerMock).payload.payloads[0].content as RayContentFrame).frame
};
