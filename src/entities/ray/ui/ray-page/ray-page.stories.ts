import type { Meta, StoryObj } from "@storybook/vue3"
import { useRay } from "../../lib"
import { rayCallerMock } from "../../mocks"
import RayPage from "./ray-page.vue"

const { normalizeRayEvent } = useRay()

export default {
  title: "Screens/Ray/RayPage",
  component: RayPage
} as Meta<typeof RayPage>

export const Default: StoryObj<typeof RayPage> = {
  args: {
    event: normalizeRayEvent(rayCallerMock)
  }
}
