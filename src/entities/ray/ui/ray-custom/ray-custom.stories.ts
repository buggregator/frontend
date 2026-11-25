import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useRay } from "../../lib";
import { rayHtmlMock, rayTextMock } from '../../mocks';
import type { RayContentCustom } from '../../types';
import RayCustom from './ray-custom.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayCustom",
  component: RayCustom
} as Meta<typeof RayCustom>;


export const Default: StoryObj<typeof RayCustom> = {
  args: {
    content: (normalizeRayEvent(rayTextMock).payload.payloads[0].content as RayContentCustom)
  }
}


// ray()->html(): the markup as a page in the mail sandbox.
export const Html: StoryObj<typeof RayCustom> = {
  args: {
    content: (normalizeRayEvent(rayHtmlMock).payload.payloads[0].content as RayContentCustom)
  }
}
