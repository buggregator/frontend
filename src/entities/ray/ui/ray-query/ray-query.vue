<script lang="ts" setup>
import { computed } from 'vue';
import {
  TableBase, TableBaseRow, CodeSnippet,
} from '@/shared/ui';
import type { RayContentSQL } from '../../types';

type Props = {
  content: RayContentSQL;
};

const props = defineProps<Props>();

const formattedSql = computed(() =>
  (props.content?.bindings || []).reduce(
    (result, binding) => (result || '').replace(
      /\?/,
      `'${binding}'`,
    ),
    props.content?.sql || '',
  ));

</script>

<template>
  <div class="ray-query">
    <CodeSnippet
      language="sql"
      :code="formattedSql"
    />
    <TableBase>
      <TableBaseRow title="Connection name">
        {{ content.connection_name }}
      </TableBaseRow>
      <TableBaseRow title="Time">
        {{ content.time }}ms
      </TableBaseRow>
    </TableBase>
  </div>
</template>

<style lang="scss" scoped>
.ray-query {
  width: 100%;
}
</style>
