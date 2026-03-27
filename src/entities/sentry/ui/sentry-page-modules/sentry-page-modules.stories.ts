import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SentryPageModules from './sentry-page-modules.vue';

export default {
  title: "Entities/Sentry/SentryPageModules",
  component: SentryPageModules,
} as Meta<typeof SentryPageModules>;

export const Default: StoryObj<typeof SentryPageModules> = {
  args: {
    modules: {
      "laravel/framework": "v9.52.4",
      "symfony/console": "v6.2.7",
      "symfony/http-foundation": "v6.2.7",
      "doctrine/dbal": "3.6.0",
      "guzzlehttp/guzzle": "7.5.0",
      "monolog/monolog": "2.9.1",
      "nesbot/carbon": "2.66.0",
      "phpunit/phpunit": "9.6.3",
      "sentry/sentry-laravel": "2.14.2",
      "league/flysystem": "3.12.3",
      "nikic/php-parser": "v4.15.3",
      "psr/log": "3.0.0",
      "ramsey/uuid": "4.7.3",
    },
  }
};
