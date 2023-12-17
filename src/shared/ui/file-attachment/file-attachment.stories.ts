import type { Meta, StoryObj } from "@storybook/vue3";
import FileAttachment from './file-attachment.vue';

export default {
  title: "Shared/FileAttachment",
  component: FileAttachment
} as Meta<typeof FileAttachment>;


export const Default: StoryObj<typeof FileAttachment> = {
  args: {
    eventId: 'cbdd3296-1e25-4191-9f52-0e2d7e7d6aae',
    attachment: {
      id: 'cbdd3296-1e25-4191-9f52-0e2d7e7d6aae',
      name: 'attachment.txt',
      size: 234234,
      mime: "text/plain",
      uri: 'example.com/attachment.txt',
    },
  }
}
