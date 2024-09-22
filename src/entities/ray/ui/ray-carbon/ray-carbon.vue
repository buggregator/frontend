<script lang="ts" setup>
import { TableBase, TableBaseRow } from "@/shared/ui";
import type { RayContentCarbon } from "../../types";

type Props = {
  carbon: RayContentCarbon;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-carbon">
    <TableBase>
      <TableBaseRow title="Formatted">
        {{ carbon.formatted }}
      </TableBaseRow>
      <TableBaseRow title="Timezone">
        {{ carbon.timezone }}
      </TableBaseRow>
      <TableBaseRow title="Timestamp">
        {{ carbon.timestamp }}
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-carbon {
  display: block;
}
</style>
