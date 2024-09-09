import type { Meta, StoryObj } from "@storybook/vue3";
import HomePage from "./home-page.vue";


export default {
  title: "Screens/Home/HomePage",
  component: HomePage
} as Meta<typeof HomePage>;

export const Default: StoryObj<typeof HomePage> = {
  args: {
  }
}

export const WithPdf: StoryObj<typeof HomePage> = {
  args: {
  }
}
