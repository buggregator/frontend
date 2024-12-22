import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayCallerMock } from '../../mocks';
import type { RayContentFrame } from '../../types';
import RayFrame from './ray-frame.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayFrame",
  component: RayFrame
} as Meta<typeof RayFrame>;


export const Default: StoryObj<typeof RayFrame> = {
  args: {
    frame: (normalizeRayEvent(rayCallerMock).payload.payloads[0].content as RayContentFrame).frame
  }
}
