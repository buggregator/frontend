import { Meta, Story } from "@storybook/vue3";
import CarbonPayload from '~/components/RayDumpPreview/RayTypesPreview/CarbonPayload.vue';
import { rayCarbonMock } from '~/src/entities/ray/mocks'
import { useRay } from "~/src/entities/ray";

const { normalizeRayEvent } = useRay();

export default {
  title: "RayDump/Types/Carbon",
  component: CarbonPayload
} as Meta<typeof CarbonPayload>;

const Template: Story = (args) => ({
  components: { CarbonPayload },
  setup() {
    return {
      args,
    };
  },
  template: `<CarbonPayload v-bind="args" />`,
});

export const Carbon = Template.bind({});
Carbon.args = {payload: normalizeRayEvent(rayCarbonMock).payload.payloads[0]};
