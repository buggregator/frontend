import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useRay } from "../../lib";
import { rayColorMock, rayDumpMock, rayZeroMock, rayIntegerMock } from '../../mocks'
import type { RayContentLog } from '../../types'
import RayLog from './ray-log.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayLog",
  component: RayLog
} as Meta<typeof RayLog>;

export const Default: StoryObj<typeof RayLog> = {
  args: {
    log: (normalizeRayEvent(rayColorMock).payload.payloads[0].content as RayContentLog).values[0]
  }
}

export const SfDump: StoryObj<typeof RayLog> = {
  args: {
    log: (normalizeRayEvent(rayDumpMock).payload.payloads[0].content as RayContentLog).values[0]
  }
}

export const Zero: StoryObj<typeof RayLog> = {
  args: {
    log: (normalizeRayEvent(rayZeroMock).payload.payloads[0].content as RayContentLog).values[0]
  }
}

export const Integer: StoryObj<typeof RayLog> = {
  args: {
    log: (normalizeRayEvent(rayIntegerMock).payload.payloads[0].content as RayContentLog).values[0]
  }
}

export const EmptyString: StoryObj<typeof RayLog> = {
  args: {
    log: ''
  }
}
