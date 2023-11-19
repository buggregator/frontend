import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayMeasureMock, rayTableMock } from '../../mocks'
import { RayContentMeasure } from "../../types";
import RayTable from './ray-table.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "FSD/entities/ray/RayTable",
  component: RayTable
} as Meta<typeof RayTable>;

const Template: Story = (args) => ({
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

