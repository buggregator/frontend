import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayExceptionMock } from '../../mocks';
import type { RayContentException } from "../../types";
import RayException from './ray-exception.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayException",
  component: RayException
} as Meta<typeof RayException>;

export const Default: StoryObj<typeof RayException> = {
  args: {
    exception: (normalizeRayEvent(rayExceptionMock).payload.payloads[0].content as RayContentException)
  }
}

