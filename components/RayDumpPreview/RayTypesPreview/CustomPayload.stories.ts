import { Meta, Story } from "@storybook/vue3";
import CustomPayload from '~/components/RayDumpPreview/RayTypesPreview/CustomPayload.vue';
import { rayTextMock } from '~/src/entities/ray/mocks'
import { useRay } from "~/src/entities/ray";

const { normalizeRayEvent } = useRay();

export default {
  title: "RayDump/Types/Custom",
  component: CustomPayload
} as Meta<typeof CustomPayload>;

const Template: Story = (args) => ({
  components: { CustomPayload },
  setup() {
    return {
      args,
    };
  },
  template: `<CustomPayload v-bind="args" />`,
});

export const Custom = Template.bind({});
Custom.args = {payload: normalizeRayEvent(rayTextMock).payload.payloads[0]};
