import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from '../../lib';
import { inspectorMock } from '../../mocks';
import InspectorPage from './inspector-page.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Entities/Inspector/InspectorPage",
  component: InspectorPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof InspectorPage>;


export const Default: StoryObj<typeof InspectorPage> = {
  args: {
    event: normalizeInspectorEvent(inspectorMock),
  }
}
