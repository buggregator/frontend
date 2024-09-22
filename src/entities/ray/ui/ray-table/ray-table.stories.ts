import type { Meta, StoryObj } from "@storybook/vue3"
import { useRay } from "../../lib"
import { rayTableMock } from "../../mocks"
import type { RayContentObject } from "../../types"
import RayTable from "./ray-table.vue"

const { normalizeRayEvent } = useRay()

export default {
  title: "Entities/ray/RayTable",
  component: RayTable
} as Meta<typeof RayTable>

export const Default: StoryObj<typeof RayTable> = {
  args: {
    table: normalizeRayEvent(rayTableMock).payload.payloads[0].content as RayContentObject
  }
}
