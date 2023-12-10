<script lang="ts" setup>
import isString from "lodash/isString";
import { onMounted } from "vue";
import SfdumpWrap from "../../lib/vendor/dumper";
import { CodeSnippet } from "../code-snippet";

type Props = {
  value: string;
  type: string;
};

const props = withDefaults(defineProps<Props>(), {
  type: "",
});

const isValueString = isString(props.value) && props.type === "string";

const dumpId = String(props.value).match(/(sf-dump-[0-9]+)/i)?.[0] || null;
const makeDumpBody = () => {
  if (props.type === "boolean") {
    return props.value === "1" ? "true" : "false";
  }

  if (dumpId) {
    return (props.value as string).replace(
      /<(style|script)\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/(style|script)>/gi,
      ""
    );
  }

  if (isValueString) {
    return `"${props.value}"`;
  }

  return props.value;
};

const dumpBody = makeDumpBody();

onMounted(() => {
  const sfdump = SfdumpWrap(window.document);

  if (dumpId) {
    sfdump(dumpId);
  }
});
</script>

<template>
  <div class="value-dump">
    <CodeSnippet v-if="isValueString" language="php" :code="dumpBody" />

    <div v-if="!isValueString" class="value-dump__html" v-html="dumpBody" />
  </div>
</template>

<style lang="scss" scoped>
@import "assets/mixins";

.value-dump {
  display: block;
}

.value-dump__html {
  @include code-example();
  @apply divide-gray-300 dark:divide-gray-600 font-mono md:px-3 lg:px-4 break-all text-2xs sm:text-xs md:text-sm lg:text-base;
}
</style>
