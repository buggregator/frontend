import type { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelEventsMock } from '../../mocks-laravel';
import type { RayContentEvent } from '../../types';
import RayEvent from './ray-event.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayEvent",
  component: RayEvent
} as Meta<typeof RayEvent>;

const Template: Story = (args) => ({
  components: { RayEvent },
  setup() {
    return {
      args,
    };
  },
  template: `<RayEvent v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayLaravelEventsMock).payload.payloads[0].content as RayContentEvent)
};

