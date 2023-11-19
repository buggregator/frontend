import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelQueryMock, rayLaravelQueryNoBindingsMock } from '../../mocks-laravel';
import { RayContentSQL } from '../../types';
import RayQuery from './ray-query.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayQuery",
  component: RayQuery
} as Meta<typeof RayQuery>;

const Template: Story = (args) => ({
  components: { RayQuery },
  setup() {
    return {
      args,
    };
  },
  template: `<RayQuery v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayLaravelQueryMock).payload.payloads[0].content as RayContentSQL)
};


export const NoBindings = Template.bind({});
NoBindings.args = {
  content: (normalizeRayEvent(rayLaravelQueryNoBindingsMock).payload.payloads[0].content as RayContentSQL)
};
