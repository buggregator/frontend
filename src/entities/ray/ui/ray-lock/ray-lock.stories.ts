import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayLockMock } from '../../mocks'
import type { RayContentLock } from '../../types'
import RayLock from './ray-lock.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayLock",
  component: RayLock
} as Meta<typeof RayLock>;


export const Default: StoryObj<typeof RayLock> = {
  args: {
    name: (normalizeRayEvent(rayLockMock).payload.payloads[0].content as RayContentLock)?.name
  }
}

