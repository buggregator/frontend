import { Meta, Story } from "@storybook/vue3";
import MeasurePayload from '~/components/RayDumpPreview/RayTypesPreview/MeasurePayload.vue';
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import { rayMeasureMock, rayMeasureStartMock } from '~/src/entities/ray/mocks'

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
Default.args = {payload: normalizeRayDumpEvent(rayMeasureMock).payload.payload.payloads[0]};

export const Start = Template.bind({});
Start.args = {payload: normalizeRayDumpEvent(rayMeasureStartMock).payload.payload.payloads[0]};
