<script lang="ts" setup>
import { ValueDump } from '@/shared/ui';
import type { RayContentCustom } from '../../types';

type Props = {
  content: RayContentCustom;
};

defineProps<Props>();
</script>

<template>
  <div class="ray-custom">
    <ValueDump :value="String(content.content)" />
  </div>
</template>
