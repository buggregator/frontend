import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayTextMock } from "../../mocks";
import type { RayContentCustom } from "../../types";
import RayCustom from "./ray-custom.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayCustom",
  component: RayCustom
} as Meta<typeof RayCustom>;

export const Default: StoryObj<typeof RayCustom> = {
  args: {
    content: normalizeRayEvent(rayTextMock).payload.payloads[0].content as RayContentCustom
  }
};
