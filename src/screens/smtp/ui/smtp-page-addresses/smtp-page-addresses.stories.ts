import type { Meta, StoryObj } from "@storybook/vue3";
import SmtpPageAddresses from './smtp-page-addresses.vue';

export default {
  title: "Screens/smtp/SmtpPageAddresses",
  component: SmtpPageAddresses,
} as Meta<typeof SmtpPageAddresses>;


export const Default: StoryObj<typeof SmtpPageAddresses> = {
  args: {
    addresses: [
      {
        name: 'John Doe',
        email: 'john-doe@example.com',
      },
      {
        name: 'Jane Smith',
        email: 'JaneSmith@example.com',
      },
      {
        email: 'saraConor@example.com',
      }
    ],
  }
};
