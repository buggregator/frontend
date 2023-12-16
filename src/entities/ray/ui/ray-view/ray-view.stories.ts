import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelViewsMock } from '../../mocks-laravel';
import type { RayContentView } from '../../types';
import RayViews from './ray-view.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayView",
  component: RayViews
} as Meta<typeof RayViews>;

const Template: StoryObj = (args: unknown) => ({
  components: { RayViews },
  setup() {
    return {
      args,
    };
  },
  template: `<RayViews v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  view: normalizeRayEvent(rayLaravelViewsMock).payload.payloads[0].content as RayContentView
};
