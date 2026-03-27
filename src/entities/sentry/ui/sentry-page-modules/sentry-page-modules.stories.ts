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

export const Python: StoryObj<typeof SentryPageModules> = {
  args: {
    platform: 'python',
    modules: {
      "django": "4.2.11",
      "redis": "5.0.3",
      "celery": "5.3.6",
      "sentry-sdk": "1.44.1",
      "requests": "2.31.0",
      "gunicorn": "21.2.0",
      "psycopg2-binary": "2.9.9",
      "boto3": "1.34.69",
      "pillow": "10.3.0",
      "pydantic": "2.6.4",
    },
  }
};
