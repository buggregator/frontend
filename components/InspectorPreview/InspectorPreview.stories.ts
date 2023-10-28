import { Meta, Story } from "@storybook/vue3";
import { normalizeInspectorEvent } from "~/utils/normalize-event";
import InspectorPreview from '~/components/InspectorPreview/InspectorPreview.vue';
import { inspectorMock } from '~/src/entities/inspector/mocks'

export default {
  title: "Inspector/Components/InspectorPreview",
  component: InspectorPreview
} as Meta<typeof InspectorPreview>;

const Template: Story = (args) => ({
  components: { InspectorPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<InspectorPreview v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeInspectorEvent(inspectorMock),
};
