import type { Meta, StoryObj } from "@storybook/vue3"
import { useMonolog } from "../../lib"
import { monologMock } from "../../mocks"
import Monolog from "./monolog-page.vue"

const { normalizeMonologEvent } = useMonolog()

export default {
  title: "Screens/Monolog/MonologPage",
  component: Monolog
} as Meta<typeof Monolog>

export const Default: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologMock)
  }
}
