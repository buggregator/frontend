import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from "../../lib";
import { inspectorMock } from "../../mocks";
import InspectorPageTimeline from "./inspector-page-timeline.vue";

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Screens/inspector/InspectorPageTimeline",
  component: InspectorPageTimeline
} as Meta<typeof InspectorPageTimeline>;

export const Default: StoryObj<typeof InspectorPageTimeline> = {
  args: {
    payload: normalizeInspectorEvent(inspectorMock).payload
  }
};
