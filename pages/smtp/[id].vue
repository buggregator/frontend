<template>
  <main class="smtp-event">
    <PageHeader
      class="smtp-event__head"
      button-title="Delete event"
      @delete="onDelete"
    >
      <NuxtLink to="/">Home</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink to="/smtp">Smtp</NuxtLink>&nbsp;/&nbsp;
      <NuxtLink :disabled="true">{{ eventId }}</NuxtLink>
    </PageHeader>

    <div v-if="pending && !event" class="smtp-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="smtp-event__body">
      <SmtpPage v-if="event" :event="event" :html-source="html" />
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useFetch, useNuxtApp, useRoute, useRouter } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useSmtp } from "~/src/entities/smtp";
import { REST_API_URL } from "~/src/shared/lib/io";
import type { EventId } from "~/src/shared/types";
import { SmtpPage } from "~/src/screens/smtp";

const { normalizeSmtpEvent } = useSmtp();

export default defineComponent({
  components: { SmtpPage, PageHeader },
  async setup() {
    const route = useRoute();
    const router = useRouter();
    const eventId = route.params.id as EventId;

    if (process.client) {
      const { $events } = useNuxtApp();
      const { data: event, pending } = await useFetch($events.getUrl(eventId), {
        onResponse({ response }) {
          return response.data;
        },
        onResponseError() {
          router.push("/404");
        },
        onRequestError() {
          router.push("/404");
        },
      });

      return {
        serverEvent: event,
        pending,
        eventId,
        html: `<iframe src="${REST_API_URL}/api/smtp/${eventId}/html"/>`,
        clearEvent: () => $events.removeById(eventId),
      };
    }

    return {
      serverEvent: null,
      pending: false,
      eventId,
      html: "",
      clearEvent: () => {},
    };
  },
  head() {
    return {
      title: `SMTP > ${this.eventId} | Buggregator`,
    };
  },
  computed: {
    event() {
      return this.serverEvent ? normalizeSmtpEvent(this.serverEvent) : null;
    },
  },
  methods: {
    onDelete() {
      this.clearEvent();

      this.$router.push("/");
    },
  },
});
</script>

<style lang="scss" scoped>
@import "assets/mixins";

.smtp-event {
  @include layout;
}

.smtp-event__head {
  @include layout-head;
}

.smtp-event__loading {
  @include loading;
  @include layout-body;
}

.smtp-event__body {
  @include layout-body;
  @apply h-full;
}
</style>
