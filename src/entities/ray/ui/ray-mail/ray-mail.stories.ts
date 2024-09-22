import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLaravelMailableMock } from "../../mocks-laravel";
import type { RayContentMail } from "../../types";
import RayMail from "./ray-mail.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayMail",
  component: RayMail,
} as Meta<typeof RayMail>;

export const Default: StoryObj<typeof RayMail> = {
  args: {
    content: normalizeRayEvent(rayLaravelMailableMock).payload.payloads[0]
      .content as RayContentMail,
  },
};
