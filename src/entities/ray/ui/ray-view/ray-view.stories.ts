import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelViewsMock } from "../../mocks-laravel";
import type { RayContentView } from "../../types";
import RayViews from "./ray-view.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayView",
  component: RayViews
} as Meta<typeof RayViews>;

export const Default: StoryObj<typeof RayViews> = {
  args: {
    view: normalizeRayEvent(rayLaravelViewsMock).payload.payloads[0].content as RayContentView
  }
};
