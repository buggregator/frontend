import type { Meta, StoryObj } from "@storybook/vue3";
import ProjectsDropdownDefault from './projects-dropdown.vue';

export default {
  title: "Widgets/ProjectsDropdownDefault",
  component: ProjectsDropdownDefault
} as Meta<typeof ProjectsDropdownDefault>;

export const Default: StoryObj<typeof ProjectsDropdownDefault> = {
  args: {
    projects: [
      {
        key: "default",
        name: "Default Project",
      },
      {
        key: "secret",
        name: "Secret Project",
      },
    ]
  }
}
