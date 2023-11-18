<script lang="ts" setup>
import PagePlaceholderItem from "./page-placeholder-item.vue";

const getHost = () => window?.location?.host || "localhost:3000";
const getHostName = () => window?.location?.hostname || "localhost";

const items = [
  {
    iconName: "github",
    title: "Buggregator",
    linkName: "Github",
    linkUrl: "https://github.com/buggregator",
  },
  {
    iconName: "sentry",
    title: "Sentry DSN",
    linkName: `http://sentry@${getHost()}/1`,
    linkUrl: "https://docs.sentry.io/product/sentry-basics/dsn-explainer/",
  },
  {
    iconName: "inspector",
    title: "Inspector URL",
    linkName: `http://${getHost()}/api/inspector`,
    linkUrl: "https://docs.inspector.dev/raw-php",
  },
  {
    iconName: "docs",
    title: "Var Dumper URL",
    linkName: `tcp://${getHostName()}:9912`,
    linkUrl:
      "https://symfony.com/doc/current/components/var_dumper.html#the-dump-server",
  },
  {
    iconName: "docs",
    title: "Monolog",
    linkName: `tcp://${getHostName()}:9913`,
    linkUrl: "https://github.com/Seldaek/monolog/blob/main/doc/sockets.md",
  },
  {
    iconName: "profiler",
    title: "XHProf URL",
    linkName: `http://${getHost()}/api/profiler/store`,
    linkUrl: "https://github.com/spiral/profiler/tree/3.0",
  },
  {
    iconName: "smtp",
    title: "SMTP URL",
    linkName: `smtp://${getHostName()}:1025`,
    linkUrl:
      "https://github.com/buggregator/spiral-app#3-fake-smtp-server-for-catching-mail",
  },
];
</script>

<template>
  <div class="page-placeholder">
    <ul class="page-placeholder__list">
      <PagePlaceholderItem
        v-for="item in items"
        :key="item.title"
        :icon-name="item.iconName"
        :title="item.title"
        :link-name="item.linkName"
        :link-url="item.linkUrl"
      />
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.page-placeholder {
  @apply p-6 bg-white dark:bg-gray-900 rounded-l text-gray-600 dark:text-gray-300 border;
}

.page-placeholder__title {
  @apply text-xl font-bold mb-3;
}

.page-placeholder__list {
  @apply flex flex-col space-y-4;
  @apply flex flex-col space-y-4;
}
</style>
