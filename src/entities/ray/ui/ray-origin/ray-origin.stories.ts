import type { Meta, StoryObj } from "@storybook/vue3"
import { useRay } from "../../lib"
import { rayCallerMock } from "../../mocks"
import type { RayPayloadOrigin } from "../../types"
import RayOrigin from "./ray-origin.vue"

const { normalizeRayEvent } = useRay()

export default {
  title: "Entities/ray/RayOrigin",
  component: RayOrigin
} as Meta<typeof RayOrigin>

export const Default: StoryObj<typeof RayOrigin> = {
  args: {
    origin: normalizeRayEvent(rayCallerMock).payload.payloads[0].origin as RayPayloadOrigin
  }
}
