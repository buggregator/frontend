<script lang="ts" setup>
import { useTitle } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { SmtpPage } from "~/src/screens/smtp";
import { useRoute, useRouter, useFetch, useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import { PageEventHeader } from "~/src/widgets/ui";
import { useSmtp } from "~/src/entities/smtp";
import type { SMTP } from "~/src/entities/smtp/types";
import { htmlEncode } from "~/src/shared/lib/helpers";
import { useEvents } from "~/src/shared/lib/use-events";
import type { Attachment, EventId, ServerEvent } from "~/src/shared/types";

const { normalizeSmtpEvent } = useSmtp();

const { params } = useRoute();
const { $authToken } = useNuxtApp();
const router = useRouter();
const eventId = params.id as EventId;

useTitle(`SMTP > ${eventId} | Buggregator`);

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
  () => `<iframe srcdoc="${htmlEncode(serverEvent.value?.payload?.html)}"/>`
);

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
  <NuxtLayout>
    <template #header>
      <PageEventHeader title="Smtp" :event-id="eventId" />
    </template>

    <div v-if="isLoading && !event" class="smtp-event__loading">
      <div></div>
      <div></div>
      <div></div>
    </div>

    <div>
      <SmtpPage
        v-if="event"
        :event="event"
        :attachments="attachments"
        :html-source="html"
      />
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.smtp-event {
}

.smtp-event__loading {
  @include loading;
}
</style>
