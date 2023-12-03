import type { Meta, Story } from "@storybook/vue3";
import { useInspector } from "../../lib";
import { inspectorMock } from '../../mocks'
import InspectorStatBoard from './inspector-stat-board.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Entities/inspector/InspectorStatBoard",
  component: InspectorStatBoard
} as Meta<typeof InspectorStatBoard>;

const Template: Story = (args) => ({
  components: {InspectorStatBoard},
  setup() {
    return {
      args,
    };
  },
  template: `<InspectorStatBoard v-bind="args"/>`,
});

export const StatBoardStories = Template.bind({});

StatBoardStories.args = {
  transaction: normalizeInspectorEvent(inspectorMock).payload[0]
};
