import {Meta, Story} from "@storybook/vue3";
import FileAttachment from './file-attachment.vue';

export default {
  title: "FSD/shared/FileAttachment",
  component: FileAttachment
} as Meta<typeof FileAttachment>;

const Template: Story = (args) => ({
  components: {FileAttachment},
  setup() {
    return {
      args,
    };
  },
  template: `
    <FileAttachment v-bind="args"/>`,
});

export const Default = Template.bind({});

Default.args = {
  eventId: 'cbdd3296-1e25-4191-9f52-0e2d7e7d6aae',
  attachment: {
    id: 'cbdd3296-1e25-4191-9f52-0e2d7e7d6aae',
    name: 'attachment.txt',
    size: 234234,
    mime: "text/plain",
    uri: 'example.com/attachment.txt',
  },
};
