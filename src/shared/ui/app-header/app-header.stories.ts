import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import AppHeader from "./app-header.vue";

const AppHeaderMeta: Meta<typeof AppHeader> = {
  title: "Shared/AppHeader",
  component: AppHeader,
  parameters: {
    slots: {
      default: 'Page title',
      controls: ''
    },
  },
  render: (args: ComponentProps<typeof AppHeader>, { parameters }) => ({
    components: { AppHeader },
    setup() {
      return {
        args,
        parameters
      };
    },
    template: `
    <AppHeader
      v-bind="args"
    >
      <template v-slot>${parameters.slots.default}</template>
      <template v-slot:controls>${parameters.slots.controls}</template>
    </AppHeader>
`,
  }),
};

export default AppHeaderMeta;

export const Default: StoryObj<typeof AppHeader> = {
  parameters: {
    slots: {
      default: 'Page title'
    },
  }
};

export const WithActions: StoryObj<typeof AppHeader> = {
  parameters: {
    slots: {
      default: `Page title`,
      controls:
        `<button class="flex mr-3 rounded-sm bg-blue-500 text-xs p-1">
          Additional button
        </button>`,
    }
  }
};
