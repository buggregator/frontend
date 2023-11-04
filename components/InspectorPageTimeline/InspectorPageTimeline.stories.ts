import {Meta, Story} from "@storybook/vue3";
import InspectorPageTimeline from '~/components/InspectorPageTimeline/InspectorPageTimeline.vue';
import { inspectorMock } from '~/src/entities/inspector/mocks'
import { useInspector } from "~/src/entities/inspector/lib";

const { normalizeInspectorEvent } = useInspector();

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
