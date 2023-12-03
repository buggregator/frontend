import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayTextMock } from '../../mocks';
import type { RayContentCustom } from '../../types';
import RayCustom from './ray-custom.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayCustom",
  component: RayCustom
} as Meta<typeof RayCustom>;

const Template: Story = (args) => ({
  components: { RayCustom },
  setup() {
    return {
      args,
    };
  },
  template: `<RayCustom v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayTextMock).payload.payloads[0].content as RayContentCustom)
};
