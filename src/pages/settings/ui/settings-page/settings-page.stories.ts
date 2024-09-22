import type { Meta, StoryObj } from "@storybook/vue3"
import SettingsPage from "./settings-page.vue"

export default {
  title: "Screens/Settings/SettingsPage",
  component: SettingsPage
} as Meta<typeof SettingsPage>

export const Default: StoryObj<typeof SettingsPage> = {
  args: {}
}
