<script lang="ts" setup>
import { ref, defineProps } from "vue";
import { IconSvg, TableBase, TableBaseRow } from "~/src/shared/ui";
import type { RayContentMail, RayUser } from "../../types";

type Props = {
  content: RayContentMail;
};

defineProps<Props>();

const collapsed = ref(true);

const getValuesField = (values: RayUser[]) => {
  const formattedValues = values.map((v) => `${v.name}[${v.email}]`) || [];
  return formattedValues.join(", ");
};
</script>

<template>
  <div class="ray-mail">
    <TableBase>
      <TableBaseRow v-if="content.subject" title="Subject">
        {{ content.subject }}
      </TableBaseRow>
      <TableBaseRow v-if="content.mailable_class" title="Mailable class">
        {{ content.mailable_class }}
      </TableBaseRow>
      <TableBaseRow v-if="content.from && content.from.length > 0" title="From">
        {{ getValuesField(content.from) }}
      </TableBaseRow>
      <TableBaseRow v-if="content.to && content.to.length > 0" title="To">
        {{ getValuesField(content.to) }}
      </TableBaseRow>
      <TableBaseRow v-if="content.cc && content.cc.length > 0" title="Cc">
        {{ getValuesField(content.cc) }}
      </TableBaseRow>
      <TableBaseRow v-if="content.bcc && content.bcc.length > 0" title="Bcc">
        {{ getValuesField(content.bcc) }}
      </TableBaseRow>
      <TableBaseRow
        v-if="content.reply_to && content.reply_to.length > 0"
        title="Reply to"
      >
        {{ getValuesField(content.reply_to) }}
      </TableBaseRow>
    </TableBase>

    <div class="ray-mail__collapsable">
      <h3 class="ray-mail__collapsable-header" @click="collapsed = !collapsed">
        <span>HTML</span>
        <IconSvg
          class="ray-mail__icon"
          name="collapsed"
          :class="{ 'ray-mail__icon--collapsed': collapsed }"
        />
      </h3>

      <div v-if="!collapsed" class="ray-mail__body">
        <div v-html="content.html" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ray-mail {
  display: block;
}

.ray-mail__icon {
  @apply w-5 h-4 border border-purple-300 shadow bg-white dark:bg-gray-600 py-1 rounded mt-0.5 flex items-center justify-center;

  .icon-svg {
    width: 10px;
  }
}

.ray-mail__icon--collapsed {
  @apply transform rotate-180;
}

.ray-mail__collapsable {
  @apply cursor-pointer;
}

.ray-mail__collapsable-header {
  @apply flex w-full justify-between py-2 px-4;
}
</style>
