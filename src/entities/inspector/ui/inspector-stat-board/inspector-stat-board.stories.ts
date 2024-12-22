import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from "../../lib";
import { inspectorMock } from '../../mocks'
import InspectorStatBoard from './inspector-stat-board.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Entities/Inspector/InspectorStatBoard",
  component: InspectorStatBoard
} as Meta<typeof InspectorStatBoard>;

export const Default: StoryObj<typeof InspectorStatBoard> = {
  args: {
    transaction: normalizeInspectorEvent(inspectorMock).payload[0]
  }
}
