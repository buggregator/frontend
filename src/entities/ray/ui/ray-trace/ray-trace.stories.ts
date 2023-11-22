import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayTraceMock } from '../../mocks';
import { RayContentFrames } from '../../types';
import RayTrace from './ray-trace.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayTrace",
  component: RayTrace
} as Meta<typeof RayTrace>;

const Template: Story = (args) => ({
  components: { RayTrace },
  setup() {
    return {
      args,
    };
  },
  template: `<RayTrace v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  frames: (normalizeRayEvent(rayTraceMock).payload.payloads[0].content as RayContentFrames).frames
};
