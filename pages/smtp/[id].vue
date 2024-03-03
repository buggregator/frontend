<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter, useFetch, useHead } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useSmtp } from "~/src/entities/smtp";
import type { SMTP } from "~/src/entities/smtp/types";
import { REST_API_URL } from "~/src/shared/lib/io";
import { useEvents } from "~/src/shared/lib/use-events";
import type { EventId, ServerEvent } from "~/src/shared/types";
import { SmtpPage } from "~/src/screens/smtp";

const { normalizeSmtpEvent } = useSmtp();

const { params } = useRoute();
const router = useRouter();
const eventId = params.id as EventId;

useHead({
  title: `SMTP > ${eventId} | Buggregator`,
});

const { events } = useEvents();

const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);

const event = computed(() =>
  serverEvent.value
    ? normalizeSmtpEvent(serverEvent.value as unknown as ServerEvent<SMTP>)
    : null
);

const html = computed(
  () => `<iframe src="${REST_API_URL}/api/smtp/${eventId}/html"/>`
);

const onDelete = () => {
  events.removeById(eventId);

  router.push("/");
};

const getEvent = async () => {
  isLoading.value = true;

  await useFetch(events.getUrl(eventId), {
    onResponse({ response: { _data } }) {
      serverEvent.value = _data;
      isLoading.value = false;
    },
    onResponseError() {
      router.push("/404");
    },
    onRequestError() {
      router.push("/404");
    },
  });
};

onMounted(getEvent);
</script>

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

    <div v-if="isLoading && !event" class="smtp-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div class="smtp-event__body">
      <SmtpPage v-if="event" :event="event" :html-source="html" />
    </div>
  </main>
</template>

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
