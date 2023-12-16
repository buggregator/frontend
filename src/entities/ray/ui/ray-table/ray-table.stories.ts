import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayTableMock } from '../../mocks'
import type { RayContentMeasure } from "../../types";
import RayTable from './ray-table.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayTable",
  component: RayTable
} as Meta<typeof RayTable>;

const Template: StoryObj = (args: unknown) => ({
  components: { RayTable },
  setup() {
    return {
      args,
    };
  },
  template: `<RayTable v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  table: normalizeRayEvent(rayTableMock).payload.payloads[0].content as RayContentMeasure
};

