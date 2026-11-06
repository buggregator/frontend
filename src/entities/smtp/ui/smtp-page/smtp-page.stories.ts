import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useSmtp } from "../../lib";
import { smtpOrderMock, smtpTextMock, smtpWelcomeMock } from '../../mocks';
import SmtpPage from "./smtp-page.vue";

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "Entities/SMTP/SmtpPage",
  component: SmtpPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SmtpPage>;

export const Default: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpWelcomeMock)
  }
};

export const Order: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpOrderMock)
  }
};

export const Text: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpTextMock)
  }
};

// An email with a script, an inline handler and a link without a target.
// Nothing runs in the sandboxed preview; the link opens a new tab.
export const HtmlWithScript: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent({
      ...smtpWelcomeMock,
      payload: {
        ...smtpWelcomeMock.payload,
        html: `<h1>Welcome</h1>
<script>parent.document.title = 'pwned'</script>
<img src="x" onerror="parent.document.title = 'pwned by onerror'">
<p><a href="https://example.com">Link without target</a></p>`,
      },
    })
  }
};
