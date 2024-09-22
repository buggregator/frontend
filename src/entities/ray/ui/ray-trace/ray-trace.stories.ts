import type { Meta, StoryObj } from "@storybook/vue3"
import { useRay } from "../../lib"
import { rayTraceMock } from "../../mocks"
import type { RayContentFrames } from "../../types"
import RayTrace from "./ray-trace.vue"

const { normalizeRayEvent } = useRay()

export default {
  title: "Entities/ray/RayTrace",
  component: RayTrace
} as Meta<typeof RayTrace>

export const Default: StoryObj<typeof RayTrace> = {
  args: {
    frames: (normalizeRayEvent(rayTraceMock).payload.payloads[0].content as RayContentFrames).frames
  }
}
