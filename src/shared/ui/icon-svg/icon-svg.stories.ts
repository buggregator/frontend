import type { Meta, StoryObj } from '@storybook/vue3';
import type { ComponentProps } from 'vue-component-type-helpers';
import IconSvg from './icon-svg.vue';

const iconNames = ((import.meta.env.STORYBOOK_ICON_SVG_NAMES as string) || '').split(',');

export default {
  title: 'Shared/IconSvg',
  component: IconSvg,
  argTypes: {
    name: {
      control: { type: 'select' },
      options: iconNames,
    },
  },
  render: (args: ComponentProps<typeof IconSvg>) => ({
    components: { IconSvg },
    setup() {
      return {
        args,
      };
    },
    template: '<div style="width: 50px"><IconSvg v-bind="args" /></div>',
  }),
} as Meta<typeof IconSvg>;

export const Default: StoryObj<typeof IconSvg> = {
  args: {
    name: 'github',
  },
};
export const AllIcons: StoryObj<typeof IconSvg> = {
  render: () => ({
    components: { IconSvg },
    setup() {
      return {
        names: iconNames,
      };
    },
    template: `
      <div style="display: flex; flex-wrap: wrap;">
        <figure v-for="name in names" class="flex flex-col items-center p-3 justify-between" style="width: 200px;">
          <IconSvg :name="name" style="width: 50px; margin: auto;" />
          <figcaption>{{ name }}</figcaption>
        </figure>
      </div>
    `,
  }),
};
