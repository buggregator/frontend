import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelEloquentMock } from '../../mocks-laravel';
import type { RayContentEloquent } from '../../types';
import RayEloquent from './ray-eloquent.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayEloquent",
  component: RayEloquent
} as Meta<typeof RayEloquent>;

const Template: StoryObj = (args: unknown) => ({
  components: { RayEloquent },
  setup() {
    return {
      args,
    };
  },
  template: `<RayEloquent v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  content: (normalizeRayEvent(rayLaravelEloquentMock).payload.payloads[0].content as RayContentEloquent)
};
