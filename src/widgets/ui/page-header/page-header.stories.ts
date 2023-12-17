import { action } from '@storybook/addon-actions'
import type { Meta, ArgTypes, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { EVENT_TYPES } from "~/src/shared/types";
import PageHeader from "./page-header.vue";

const PageHeaderMeta: Meta<typeof PageHeader> = {
  title: "Widgets/PageHeader",
  component: PageHeader,
  argTypes: {
    onDelete: action('Delete event'),
    eventType: {
      control: { type: 'select' },
      options: Object.values(EVENT_TYPES),
      mapping: EVENT_TYPES
    },
    slots: {
      default: 'Page title',
      controls: ''
    },
  },
  render: (args: ComponentProps<typeof PageHeader>, { argTypes }: { argTypes: ArgTypes }) => ({
    // props: Object.keys(argTypes as object),
    components: { PageHeader },
    methods: {
      action
    },
    setup() {
      return {
        args,
        argTypes
      };
    },
    template: `
    <PageHeader
      v-bind="args"
    >
      <template v-slot>${argTypes.slots.default}</template>
      <template v-slot:controls>${argTypes.slots.controls}</template>
    </PageHeader>
`,
  }),
};

export default PageHeaderMeta;

export const Default: StoryObj<typeof PageHeader> = {
  args: {
    buttonTitle: "Delete event",

  },
  argTypes: {
    ...PageHeaderMeta.argTypes,
    slots: {
      default: 'Page title'
    },
  }
};

export const WithActions: StoryObj<typeof PageHeader> = {
  args: {
    buttonTitle: "Delete event",
  },
  argTypes: {
    ...PageHeaderMeta.argTypes,
    slots: {
      default: `Page title`,
      controls:
        `<button
          class="flex mr-3 rounded-sm bg-blue-500 text-xs p-1"
          @click="(a) => action('Custom action event')(a)"
        >
          Additional button
        </button>`,
    }
  }
};
