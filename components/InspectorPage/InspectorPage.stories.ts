import {Meta, Story} from "@storybook/vue3";
import {normalizeInspectorEvent} from "~/utils/normalize-event";
import InspectorPage from '~/components/InspectorPage/InspectorPage.vue';
import { inspectorMock } from '~/src/entities/inspector/mocks'

export default {
  title: "Inspector/Page/InspectorPage",
  component: InspectorPage
} as Meta<typeof InspectorPage>;

const Template: Story = (args) => ({
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
