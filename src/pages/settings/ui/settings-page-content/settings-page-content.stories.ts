import type { Meta, StoryObj } from "@storybook/vue3";
import SettingsPageContent from "./settings-page-content.vue";

export default {
  title: "Screens/Settings/SettingsPageContent",
  component: SettingsPageContent
} as Meta<typeof SettingsPageContent>;

export const Default: StoryObj<typeof SettingsPageContent> = {
  args: {}
};
