<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { SmtpPage } from "~/src/screens/smtp";
import { useRoute, useRouter, useFetch, useHead, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageHeader } from "~/src/widgets/ui";
import { useSmtp } from "~/src/entities/smtp";
import type { SMTP } from "~/src/entities/smtp/types";
import { REST_API_URL } from "~/src/shared/lib/io";
import { useEvents } from "~/src/shared/lib/use-events";
import type { Attachment, EventId, ServerEvent } from "~/src/shared/types";

const { normalizeSmtpEvent } = useSmtp();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useHead({
  title: `SMTP > ${eventId} | Buggregator`,
});

const { events } = useEvents();
const { getAttachments } = useSmtp();
const isLoading = ref(false);
const serverEvent = ref<Event | null>(null);
const serverAttachments = ref<Attachment[]>([]);

const event = computed(() =>
  serverEvent.value
    ? normalizeSmtpEvent(serverEvent.value as unknown as ServerEvent<SMTP>)
    : null
);

const attachments = computed(() => serverAttachments.value);

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
    headers: { "X-Auth-Token": $authToken.token || "" },
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

  await getAttachments(eventId).then((_attachments: Attachment[]) => {
    serverAttachments.value = _attachments;
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
      <SmtpPage
        v-if="event"
        :event="event"
        :attachments="attachments"
        :html-source="html"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

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
