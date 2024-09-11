import type { Meta, StoryObj } from "@storybook/vue3";
import LoginPage from "./login-page.vue";

export default {
  title: "Screens/Login/LoginPage",
  component: LoginPage
} as Meta<typeof LoginPage>;

export const Default: StoryObj<typeof LoginPage> = {
  args: {
  }
}
