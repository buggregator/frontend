<script lang="ts" setup>
import isString from "lodash/isString";
import { onMounted } from "vue";
import SfdumpWrap from "../../lib/vendor/dumper";
import { CodeSnippet } from "../code-snippet";

type Props = {
  value: string;
  type: string;
  language: string;
};

const props = withDefaults(defineProps<Props>(), {
  type: "",
  language: "plaintext",
});

const isValueString = isString(props.value) && props.type === "string";
const isValueCode = isString(props.value) && (props.type === "code");

const dumpId = String(props.value).match(/(sf-dump-[0-9]+)/i)?.[0] || null;
const makeDumpBody = () => {
  if (props.type === "boolean") {
    return props.value === "1" ? "true" : "false";
  }

  if (isValueString && !props.value.replace(/\s/g, '').length) {
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
    <CodeSnippet v-if="isValueString || isValueCode" :language="language" :code="dumpBody"/>
    <div v-else class="value-dump__html" v-html="dumpBody"/>
  </div>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.value-dump {
  display: block;
}

.value-dump__html {
  @include code-example();
  @apply divide-gray-300 dark:divide-gray-600;
  @apply font-mono break-all text-2xs sm:text-xs md:text-sm lg:text-base;
  @apply p-1 md:p-3 lg:p-4;
}
</style>
