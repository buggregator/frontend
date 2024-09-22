import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayCarbonMock } from "../../mocks";
import type { RayContentCarbon } from "../../types";
import RayCarbon from "./ray-carbon.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayCarbon",
  component: RayCarbon,
} as Meta<typeof RayCarbon>;

export const Default: StoryObj<typeof RayCarbon> = {
  args: {
    carbon: normalizeRayEvent(rayCarbonMock).payload.payloads[0].content as RayContentCarbon,
  },
};
