import {Meta, Story} from "@storybook/vue3";
import { useInspector } from "~/src/entities/inspector";
import { inspectorMock } from '~/src/entities/inspector/mocks'
import InspectorPageTimeline from './inspector-page-timeline.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "FSD/screens/inspector/InspectorPageTimeline",
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
  payload: normalizeInspectorEvent(inspectorMock).payload,
};
