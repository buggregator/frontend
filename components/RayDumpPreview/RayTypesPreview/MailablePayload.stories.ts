import { Meta, Story } from "@storybook/vue3";
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import MailablePayload from "~/components/RayDumpPreview/RayTypesPreview/MailablePayload.vue";
import { rayLaravelMailableMock } from '~/src/entities/ray/mocks-laravel'

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
Mailable.args = {payload: normalizeRayDumpEvent(rayLaravelMailableMock).payload.payload.payloads[0]};

