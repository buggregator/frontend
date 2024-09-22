<script lang="ts" setup>
import { TableBase, TableBaseRow, ValueDump } from "@/shared/ui";
import type { RayContentObject } from "../../types";

type Props = {
  table: RayContentObject;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-table">
    <TableBase>
      <TableBaseRow
        v-for="(value, title) in table.values"
        :key="title"
        :title="String(title)"
      >
        <ValueDump
          v-if="value"
          :value="value"
        />

        <span v-if="!value" />
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-table {
  display: block;
}
</style>
