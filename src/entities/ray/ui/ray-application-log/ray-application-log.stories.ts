import type { Meta, StoryObj } from "@storybook/vue3"
import { useRay } from "../../lib"
import { rayLaravelApplicationLogMock } from "../../mocks-laravel"
import type { RayContentApplicationLog } from "../../types"
import RayApplicationLog from "./ray-application-log.vue"

const { normalizeRayEvent } = useRay()

export default {
  title: "Entities/ray/RayApplicationLog",
  component: RayApplicationLog
} as Meta<typeof RayApplicationLog>

export const Default: StoryObj<typeof RayApplicationLog> = {
  args: {
    content: normalizeRayEvent(rayLaravelApplicationLogMock).payload.payloads[0]
      .content as RayContentApplicationLog
  }
}
