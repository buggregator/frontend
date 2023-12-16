import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayColorMock } from '../../mocks'
import type { RayContentLog } from '../../types'
import RayLog from './ray-log.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayLog",
  component: RayLog
} as Meta<typeof RayLog>;

const Template: StoryObj = (args: unknown) => ({
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
