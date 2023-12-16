import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from "../../lib";
import { inspectorMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Entities/inspector/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: StoryObj = (args: unknown) => ({
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
