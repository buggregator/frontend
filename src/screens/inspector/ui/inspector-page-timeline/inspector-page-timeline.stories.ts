import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from "~/src/entities/inspector";
import { inspectorMock } from '~/src/entities/inspector/mocks'
import InspectorPageTimeline from './inspector-page-timeline.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Screens/inspector/InspectorPageTimeline",
  component: InspectorPageTimeline
} as Meta<typeof InspectorPageTimeline>;

export const Default: StoryObj<typeof InspectorPageTimeline> = {
  args: {
    payload: normalizeInspectorEvent(inspectorMock).payload,
  }
}

