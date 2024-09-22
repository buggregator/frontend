import type { Meta, StoryObj } from "@storybook/vue3"
import { profilerEdgesMock } from "../../mocks"
import CallStatBoard from "./call-stat-board.vue"

export default {
  title: "Entities/Profiler/CallStatBoard",
  component: CallStatBoard
} as Meta<typeof CallStatBoard>

export const Default: StoryObj<typeof CallStatBoard> = {
  args: {
    title: profilerEdgesMock.e5.caller,
    cost: profilerEdgesMock.e5.cost
  }
}
