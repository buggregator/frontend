import { Meta, Story } from "@storybook/vue3";
import LogPayload from '~/components/RayDumpPreview/RayTypesPreview/LogPayload.vue';
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import { rayColorMock } from '~/src/entities/ray/mocks'

export default {
  title: "RayDump/Types/Log",
  component: LogPayload
} as Meta<typeof LogPayload>;

const Template: Story = (args) => ({
  components: { LogPayload },
  setup() {
    return {
      args,
    };
  },
  template: `<LogPayload v-bind="args" />`,
});

export const Log = Template.bind({});
Log.args = {payload: normalizeRayDumpEvent(rayColorMock).payload.payload.payloads[0]};
