import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import {htmlEncode} from "@/shared/lib/helpers";
import { HTMLCode } from '@/shared/mocks'
import SmtpPagePreview from './smtp-page-preview.vue';

export default {
  title: "Screens/smtp/SmtpPagePreview",
  component: SmtpPagePreview,
  render: (args: ComponentProps<typeof SmtpPagePreview>) => ({
    components: { SmtpPagePreview },
    setup() {
      return {
        args,
      };
    },
    template: `<div style="height: 100vh">
      <SmtpPagePreview v-bind="args">
        <iframe srcdoc="<html>${htmlEncode(HTMLCode)}</html>"></iframe>
      </SmtpPagePreview>
    </div>`,
  })
} as Meta<typeof SmtpPagePreview>;


export const Default: StoryObj<typeof SmtpPagePreview> = {
  args: {}
};
export const Tablet = {
  args: {
    device: 'tablet',
  }
};

export const Mobile: StoryObj<typeof SmtpPagePreview> = {
  args: {
    device: 'mobile',
  }
};

export const Desktop: StoryObj<typeof SmtpPagePreview> = {
  args: {
    device: 'desktop',
  }
};
