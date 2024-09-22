<script lang="ts" setup>
import { ref } from "vue";
import { IconSvg, TableBase, TableBaseRow } from "@/shared/ui";
import type { Sentry } from "../../types";

type Props = {
  extra: Sentry["extra"];
};

const props = defineProps<Props>();

const ddStates = ref(
  Object.keys(props.extra || {}).reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<string, boolean>
  )
);
</script>

<template>
  <section class="sentry-page-extra">
    <h3 class="sentry-page-extra__head">
      Extra
    </h3>

    <div class="sentry-page-extra__in">
      <div
        v-for="(value, key) in extra"
        :key="key"
        class="sentry-page-extra__wrapper"
        :class="{
          'sentry-page-extra__wrapper--open': ddStates[key]
        }"
      >
        <h3
          class="sentry-page-extra__title"
          @click="ddStates[key] = !ddStates[key]"
        >
          {{ key }}

          <IconSvg
            class="sentry-page-extra__title-dd"
            :class="{
              'sentry-page-extra__title-dd--open': ddStates[key]
            }"
            name="dd"
          />
        </h3>

        <TableBase
          v-if="value"
          class="sentry-page-extra__content"
        >
          <TableBaseRow
            v-for="(v, t) in value"
            :key="t"
            :title="String(t || '')"
          >
            {{ JSON.stringify(v) }}
          </TableBaseRow>
        </TableBase>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.sentry-page-extra {
}

.sentry-page-extra__wrapper {
  @apply dark:bg-gray-900 bg-gray-100 p-3 border border-purple-300 dark:border-gray-400;

  &:first-child {
    @apply rounded-t-md;
  }

  &:last-child {
    @apply rounded-b-md;
  }
}

.sentry-page-extra__head {
  @include text-muted;
  @apply font-bold uppercase text-sm flex justify-between mb-3;
}

.sentry-page-extra__title {
  @include text-muted;
  @apply font-bold uppercase text-sm flex justify-between;
}

.sentry-page-extra__url {
  @apply mb-1 text-lg font-medium;
}

.sentry-page-extra__title-dd {
  @apply ml-2 w-5 ml-auto transform rotate-180;
}

.sentry-page-extra__title-dd--open {
  @apply rotate-0;
}

.sentry-page-extra__content {
  display: none;
  @apply mt-3;

  .sentry-page-extra__wrapper--open & {
    display: block;
  }
}
</style>
