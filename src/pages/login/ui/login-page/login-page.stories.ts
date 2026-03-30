import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LoginPage from "./login-page.vue";

export default {
  title: "Screens/Login/LoginPage",
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof LoginPage>;

export const Default: StoryObj<typeof LoginPage> = {}

export const Dark: StoryObj<typeof LoginPage> = {
  parameters: {
    backgrounds: { default: 'dark' },
  }
}
