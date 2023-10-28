import { Meta, Story } from "@storybook/vue3";
import ExceptionPayload from '~/components/RayDumpPreview/RayTypesPreview/ExceptionPayload.vue';
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import { rayExceptionMock } from '~/src/entities/ray/mocks';

export default {
  title: "RayDump/Types/Exception",
  component: ExceptionPayload
} as Meta<typeof ExceptionPayload>;

const Template: Story = (args) => ({
  components: { ExceptionPayload },
  setup() {
    return {
      args,
    };
  },
  template: `<ExceptionPayload v-bind="args" />`,
});

export const Exception = Template.bind({});
Exception.args = {payload: normalizeRayDumpEvent(rayExceptionMock).payload.payload.payloads[0]};
