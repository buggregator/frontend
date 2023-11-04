import { Meta, Story } from "@storybook/vue3";
import SmtpPage from "~/components/SmtpPage/SmtpPage.vue";
import { smtpWelcomeMock } from '~/src/entities/smtp/mocks';
import { useSmtp } from "~/src/entities/smtp";

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "Smtp/Page/SmtpPage",
  component: SmtpPage
} as Meta<typeof SmtpPage>;

const Template: Story = (args) => ({
  components: { SmtpPage },
  setup() {
    return {
      args,
    };
  },
  template: `<SmtpPage v-bind="args" />`,
});

export const Default = Template.bind({});

const normalizeEvent = normalizeSmtpEvent(smtpWelcomeMock)

Default.args = {
  event: normalizeEvent,
  htmlSource: normalizeEvent.payload.html
};
