import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryPageSdk from './sentry-page-sdk.vue';

export default {
  title: "Entities/Sentry/SentryPageSdk",
  component: SentryPageSdk,
} as Meta<typeof SentryPageSdk>;

export const JavaScriptBrowser: StoryObj<typeof SentryPageSdk> = {
  args: {
    sdk: {
      name: "sentry.javascript.browser",
      version: "7.69.0",
      integrations: [
        "InboundFilters",
        "FunctionToString",
        "TryCatch",
        "Breadcrumbs",
        "GlobalHandlers",
        "LinkedErrors",
        "Dedupe",
        "HttpContext",
        "BrowserTracing",
        "Replay",
      ],
      packages: [
        { name: "loader:@sentry/browser", version: "7.69.0" },
      ],
    },
  }
};

export const PHPLaravel: StoryObj<typeof SentryPageSdk> = {
  args: {
    sdk: {
      name: "sentry.php.laravel",
      version: "2.14.2",
    },
  }
};
