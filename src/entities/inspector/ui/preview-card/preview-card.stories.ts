import { Meta, Story } from "@storybook/vue3";
import { useInspector } from "../../lib";
import { inspectorMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "FSD/entities/inspector/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: Story = (args) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeInspectorEvent(inspectorMock),
};
