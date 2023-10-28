import {Meta, Story} from "@storybook/vue3";
import {normalizeInspectorEvent} from "~/utils/normalize-event";
import InspectorStatBoard from '~/components/InspectorStatBoard/InspectorStatBoard.vue';
import { inspectorMock } from '~/src/entities/inspector/mocks'

export default {
  title: "Inspector/Components/InspectorStatBoard",
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
