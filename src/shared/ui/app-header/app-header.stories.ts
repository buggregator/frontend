import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { ComponentProps } from "vue-component-type-helpers";
import AppHeader from "./app-header.vue";

const AppHeaderMeta: Meta<typeof AppHeader> = {
  title: "Shared/AppHeader",
  component: AppHeader,
  parameters: {
    slots: {
      default: 'Page title',
      controls: '',
      toolbar: ''
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
      <template v-if="parameters.slots.toolbar" v-slot:toolbar><span v-html="parameters.slots.toolbar" /></template>
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

export const TwoRows: StoryObj<typeof AppHeader> = {
  parameters: {
    slots: {
      default: `<span class="nav__crumb">Home</span><span class="nav__sep" aria-hidden="true">/</span><span class="nav__current">Monolog</span>`,
      controls: `<button class="action-btn">Clear</button>`,
      toolbar: `<button class="action-btn">+ Add filter</button>`
    }
  }
};
