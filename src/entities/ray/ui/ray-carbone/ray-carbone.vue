<script lang="ts" setup>
import { TableBase, TableBaseRow } from "~/src/shared/ui";
import type { RayContentCarbone } from "../../types";

type Props = {
  carbone: RayContentCarbone;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-carbon">
    <TableBase>
      <TableBaseRow title="Formatted">
        {{ carbone.formatted }}
      </TableBaseRow>
      <TableBaseRow title="Timezone">
        {{ carbone.timezone }}
      </TableBaseRow>
      <TableBaseRow title="Timestamp">
        {{ carbone.timestamp }}
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-carbon {
  display: block;
}
</style>
