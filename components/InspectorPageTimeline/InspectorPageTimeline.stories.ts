import {Meta, Story} from "@storybook/vue3";
import {normalizeInspectorEvent} from "~/utils/normalize-event";
import InspectorPageTimeline from '~/components/InspectorPageTimeline/InspectorPageTimeline.vue';
import { inspectorMock } from '~/src/entities/inspector/mocks'

export default {
  title: "Inspector/Page/InspectorPageTimeline",
  component: InspectorPageTimeline
} as Meta<typeof InspectorPageTimeline>;

const Template: Story = (args) => ({
  components: {InspectorPageTimeline},
  setup() {
    return {
      args,
    };
  },
  template: `<InspectorPageTimeline v-bind="args"/>`,
});

export const Timeline = Template.bind({});

Timeline.args = {
  event: normalizeInspectorEvent(inspectorMock)
};
