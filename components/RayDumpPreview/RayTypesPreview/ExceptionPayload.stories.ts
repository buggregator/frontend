import { Meta, Story } from "@storybook/vue3";
import ExceptionPayload from '~/components/RayDumpPreview/RayTypesPreview/ExceptionPayload.vue';
import { rayExceptionMock } from '~/src/entities/ray/mocks';
import { useRay } from "~/src/entities/ray";

const { normalizeRayEvent } = useRay();

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
Exception.args = {payload: normalizeRayEvent(rayExceptionMock).payload.payloads[0]};
