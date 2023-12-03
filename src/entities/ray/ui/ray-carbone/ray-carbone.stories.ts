import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayCarbonMock } from '../../mocks'
import type { RayContentCarbone } from "../../types";
import RayCarbon from './ray-carbone.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayCarbon",
  component: RayCarbon
} as Meta<typeof RayCarbon>;

const Template: Story = (args) => ({
  components: { RayCarbon },
  setup() {
    return {
      args,
    };
  },
  template: `<RayCarbon v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  carbone: normalizeRayEvent(rayCarbonMock).payload.payloads[0].content as RayContentCarbone,
};
