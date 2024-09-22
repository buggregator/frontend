import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { htmlEncode } from "../../lib/helpers";
import { HTMLCode } from "../../mocks";
import EmailPreview from "./email-preview.vue";
import { Device } from "./types";

export default {
  title: "Shared/EmailPreview",
  component: EmailPreview,
  render: (args: ComponentProps<typeof EmailPreview>) =>
    ({
      components: { EmailPreview },
      setup() {
        return {
          args,
        };
      },
      template: `<div style="height: 100vh">
      <EmailPreview v-bind="args">
        <iframe srcdoc="<html>${htmlEncode(HTMLCode)}</html>"></iframe>
      </EmailPreview>
    </div>`,
    }),
} as Meta<typeof EmailPreview>;

export const Default: StoryObj<typeof EmailPreview> = {
  args: {},
};
export const Tablet = {
  args: {
    device: Device.Tablet,
  },
};

export const Mobile: StoryObj<typeof EmailPreview> = {
  args: {
    device: Device.Mobile,
  },
};

export const Desktop: StoryObj<typeof EmailPreview> = {
  args: {
    device: Device.Desktop,
  },
};
