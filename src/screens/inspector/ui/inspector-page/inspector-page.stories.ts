import type { Meta, StoryObj } from "@storybook/vue3";
import { useInspector } from "~/src/entities/inspector";
import { inspectorMock } from '~/src/entities/inspector/mocks'
import InspectorPage from './inspector-page.vue';

const { normalizeInspectorEvent } = useInspector();

export default {
  title: "Screens/inspector/InspectorPage",
  component: InspectorPage
} as Meta<typeof InspectorPage>;

const Template: StoryObj = (args: unknown) => ({
  components: {InspectorPage},
  setup() {
    return {
      args,
    };
  },
  template: `<InspectorPage v-bind="args"/>`,
});

export const Default = Template.bind({});


Default.args = {
  event: normalizeInspectorEvent(inspectorMock),
};
