import { Meta, Story } from "@storybook/vue3";
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import eventMock from '~/mocks/ray-laravel-mailable.json';
import MailablePayload from "~/components/RayDumpPreview/RayTypesPreview/MailablePayload.vue";

export default {
  title: "RayDump/Types/Mailable",
  component: MailablePayload
} as Meta<typeof MailablePayload>;

const Template: Story = (args) => ({
  components: { MailablePayload},
  setup() {
    return {
      args,
    };
  },
  template: `<MailablePayload v-bind="args" />`,
});

export const Mailable = Template.bind({});
Mailable.args = {payload: normalizeRayDumpEvent(eventMock).payload.payload.payloads[0]};

