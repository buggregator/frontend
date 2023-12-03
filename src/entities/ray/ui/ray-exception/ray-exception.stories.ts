import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayExceptionMock } from '../../mocks';
import type { RayContentException } from "../../types";
import RayException from './ray-exception.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayException",
  component: RayException
} as Meta<typeof RayException>;

const Template: Story = (args) => ({
  components: { RayException },
  setup() {
    return {
      args,
    };
  },
  template: `<RayException v-bind="args" />`,
});

export const Exception = Template.bind({});
Exception.args = {
  exception: normalizeRayEvent(rayExceptionMock).payload.payloads[0].content as RayContentException,
};
