import { Meta, Story } from "@storybook/vue3";
import MeasurePayload from '~/components/RayDumpPreview/RayTypesPreview/MeasurePayload.vue';
import { rayMeasureMock, rayMeasureStartMock } from '~/src/entities/ray/mocks'
import { useRay } from "~/src/entities/ray";

const { normalizeRayEvent } = useRay();

export default {
  title: "RayDump/Types/Measure",
  component: MeasurePayload
} as Meta<typeof MeasurePayload>;

const Template: Story = (args) => ({
  components: { MeasurePayload },
  setup() {
    return {
      args,
    };
  },
  template: `<MeasurePayload v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {payload: normalizeRayEvent(rayMeasureMock).payload.payloads[0]};

export const Start = Template.bind({});
Start.args = {payload: normalizeRayEvent(rayMeasureStartMock).payload.payloads[0]};
